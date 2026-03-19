# services/ml/als_recommender.py

import numpy as np
from implicit.als import AlternatingLeastSquares
import redis
import json
from typing import List, Dict
import pandas as pd
from datetime import datetime, timedelta

class ALSRecommender:
    """
    Moteur de recommandation ALS - Utilisé par Spotify, Amazon, Netflix
    """
    
    def __init__(self, factors: int = 50, iterations: int = 15):
        self.factors = factors  # Nombre de facteurs latents (50-200)
        self.iterations = iterations
        self.model = AlternatingLeastSquares(
            factors=factors,
            iterations=iterations,
            regularization=0.1,
            use_gpu=False  # True si tu as un GPU
        )
        self.redis_client = redis.Redis(
            host=process.env.REDIS_HOST,
            port=process.env.REDIS_PORT,
            decode_responses=True
        )
        self.user_map = {}  # Mapping user_id -> index
        self.item_map = {}  # Mapping product_id -> index
        self.reverse_user_map = {}
        self.reverse_item_map = {}
        
    async def train(self, db_session):
        """
        Entraîne le modèle sur toutes les interactions
        """
        print("📊 Récupération des interactions...")
        
        # Récupérer les interactions des 90 derniers jours
        interactions = await db_session.execute("""
            SELECT 
                i."userId",
                i."productId",
                COUNT(*) * 
                CASE 
                    WHEN i.type = 'PURCHASE' THEN 5
                    WHEN i.type = 'ADD_TO_CART' THEN 3
                    WHEN i.type = 'VIEW' THEN 1
                    WHEN i.type = 'SHARE' THEN 2
                    ELSE 0.5
                END as weight
            FROM "Interaction" i
            WHERE i."createdAt" > NOW() - INTERVAL '90 days'
            GROUP BY i."userId", i."productId", i.type
        """)
        
        # Construire la matrice utilisateur-produit
        df = pd.DataFrame(interactions)
        
        # Créer les mappings
        users = df['userId'].unique()
        items = df['productId'].unique()
        
        self.user_map = {uid: idx for idx, uid in enumerate(users)}
        self.item_map = {pid: idx for idx, pid in enumerate(items)}
        self.reverse_user_map = {idx: uid for uid, idx in self.user_map.items()}
        self.reverse_item_map = {idx: pid for pid, idx in self.item_map.items()}
        
        # Créer la matrice sparse
        rows = [self.user_map[uid] for uid in df['userId']]
        cols = [self.item_map[pid] for pid in df['productId']]
        data = df['weight'].values
        
        from scipy.sparse import csr_matrix
        user_item_matrix = csr_matrix(
            (data, (rows, cols)),
            shape=(len(users), len(items))
        )
        
        print(f"✅ Matrice créée: {user_item_matrix.shape}")
        
        # Entraîner le modèle
        print("🎯 Entraînement du modèle ALS...")
        self.model.fit(user_item_matrix)
        
        print("✅ Modèle entraîné avec succès")
        
        # Sauvegarder les mappings dans Redis
        self.redis_client.set('als:user_map', json.dumps(self.user_map))
        self.redis_client.set('als:item_map', json.dumps(self.item_map))
        
        return True
    
    async def recommend_for_user(
        self, 
        user_id: str, 
        limit: int = 24,
        exclude_ids: List[str] = None
    ) -> List[Dict]:
        """
        Recommande des produits pour un utilisateur
        """
        if user_id not in self.user_map:
            return await self.fallback_recommendations(limit, exclude_ids)
        
        user_idx = self.user_map[user_id]
        
        # Obtenir les recommandations du modèle
        recommended = self.model.recommend(
            user_idx,
            user_item_matrix[user_idx],  # Les interactions de l'utilisateur
            N=limit * 2,  # Prendre plus pour pouvoir filtrer
            filter_already_liked_items=True
        )
        
        # Convertir les indices en IDs produits
        recommendations = []
        for item_idx, score in zip(recommended[0], recommended[1]):
            product_id = self.reverse_item_map[item_idx]
            
            # Exclure ceux déjà vus
            if exclude_ids and product_id in exclude_ids:
                continue
                
            # Récupérer les infos produit
            product = await self.get_product_info(product_id)
            if product:
                recommendations.append({
                    **product,
                    'score': float(score),
                    'reason': 'Recommandé par IA (collaborative)',
                    'model_version': 'als_v1'
                })
                
            if len(recommendations) >= limit:
                break
        
        # Si pas assez, compléter avec fallback
        if len(recommendations) < limit:
            fallback = await self.fallback_recommendations(
                limit - len(recommendations),
                exclude_ids
            )
            recommendations.extend(fallback)
        
        return recommendations
    
    async def recommend_similar_products(
        self,
        product_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Trouve des produits similaires (item-based)
        """
        if product_id not in self.item_map:
            return []
        
        item_idx = self.item_map[product_id]
        
        # Obtenir les produits similaires
        similar = self.model.similar_items(item_idx, N=limit + 1)
        
        recommendations = []
        for item_idx, score in zip(similar[0], similar[1]):
            if item_idx == item_idx:  # Ignorer le produit lui-même
                continue
                
            product_id = self.reverse_item_map[item_idx]
            product = await self.get_product_info(product_id)
            if product:
                recommendations.append({
                    **product,
                    'score': float(score),
                    'reason': 'Produit similaire',
                    'model_version': 'als_v1'
                })
                
            if len(recommendations) >= limit:
                break
        
        return recommendations
    
    async def fallback_recommendations(
        self,
        limit: int,
        exclude_ids: List[str] = None
    ) -> List[Dict]:
        """
        Fallback: produits populaires
        """
        from prisma import Prisma
        
        prisma = Prisma()
        await prisma.connect()
        
        products = await prisma.product.find_many(
            where={
                'status': 'ACTIVE',
                'id': {'not_in': exclude_ids} if exclude_ids else None
            },
            order_by=[
                {'purchaseCount': 'desc'},
                {'viewCount': 'desc'}
            ],
            take=limit
        )
        
        await prisma.disconnect()
        
        return [{
            'id': p.id,
            'title': p.title,
            'price': p.price,
            'image': p.images[0] if p.images else None,
            'score': 0.1,
            'reason': 'Populaire'
        } for p in products]
    
    async def get_product_info(self, product_id: str) -> Dict:
        """
        Récupère les infos produit depuis le cache ou la DB
        """
        # Vérifier le cache Redis
        cache_key = f'product:{product_id}'
        cached = self.redis_client.get(cache_key)
        
        if cached:
            return json.loads(cached)
        
        # Sinon, aller en DB
        from prisma import Prisma
        
        prisma = Prisma()
        await prisma.connect()
        
        product = await prisma.product.find_unique(
            where={'id': product_id},
            include={'category': True}
        )
        
        await prisma.disconnect()
        
        if not product:
            return None
        
        # Mettre en cache pour 1 heure
        product_data = {
            'id': product.id,
            'title': product.title,
            'price': product.price,
            'image': product.images[0] if product.images else None,
            'category': product.category.name if product.category else None
        }
        
        self.redis_client.setex(cache_key, 3600, json.dumps(product_data))
        
        return product_data


# services/ml/scheduler.py

import asyncio
from datetime import datetime, timedelta
from als_recommender import ALSRecommender

class MLTrainScheduler:
    """
    Planificateur d'entraînement du modèle
    """
    
    def __init__(self):
        self.recommender = ALSRecommender()
        self.is_training = False
        
    async def start(self):
        """
        Lance le scheduler
        """
        while True:
            now = datetime.now()
            
            # Entraînement quotidien à 3h du matin
            if now.hour == 3 and not self.is_training:
                asyncio.create_task(self.train_model())
            
            # Mise à jour des scores toutes les heures
            if now.minute == 0:
                asyncio.create_task(self.update_scores())
            
            await asyncio.sleep(60)  # Vérifier toutes les minutes
    
    async def train_model(self):
        """
        Entraîne le modèle complet
        """
        self.is_training = True
        print(f"🚀 Début entraînement: {datetime.now()}")
        
        try:
            from prisma import Prisma
            prisma = Prisma()
            await prisma.connect()
            
            await self.recommender.train(prisma)
            
            # Sauvegarder le modèle
            await self.save_model()
            
            print(f"✅ Entraînement terminé: {datetime.now()}")
            
        except Exception as e:
            print(f"❌ Erreur entraînement: {e}")
            
        finally:
            self.is_training = False
    
    async def update_scores(self):
        """
        Met à jour les scores ForYouScore pour les utilisateurs actifs
        """
        from prisma import Prisma
        
        prisma = Prisma()
        await prisma.connect()
        
        # Récupérer les utilisateurs actifs des dernières 24h
        active_users = await prisma.interaction.group_by(
            by=['userId'],
            where={
                'createdAt': {'gte': datetime.now() - timedelta(days=1)}
            },
            take=1000
        )
        
        for user in active_users:
            if not user['userId']:
                continue
                
            # Calculer les recommandations
            recommendations = await self.recommender.recommend_for_user(
                user['userId'],
                limit=50
            )
            
            # Sauvegarder dans ForYouScore
            for rec in recommendations:
                await prisma.foryouscore.upsert(
                    where={
                        'userId_productId_variantId_version': {
                            'userId': user['userId'],
                            'productId': rec['id'],
                            'variantId': '00000000-0000-0000-0000-000000000000',
                            'version': 1
                        }
                    },
                    update={
                        'score': rec['score'],
                        'factors': {'als_score': rec['score']},
                        'expiresAt': datetime.now() + timedelta(days=7)
                    },
                    create={
                        'userId': user['userId'],
                        'productId': rec['id'],
                        'variantId': '00000000-0000-0000-0000-000000000000',
                        'score': rec['score'],
                        'factors': {'als_score': rec['score']},
                        'expiresAt': datetime.now() + timedelta(days=7),
                        'version': 1
                    }
                )
        
        await prisma.disconnect()
        print(f"✅ Scores mis à jour pour {len(active_users)} utilisateurs")
    
    async def save_model(self):
        """
        Sauvegarde le modèle entraîné
        """
        import pickle
        
        # Sauvegarder les mappings
        with open('models/user_map.pkl', 'wb') as f:
            pickle.dump(self.recommender.user_map, f)
        
        with open('models/item_map.pkl', 'wb') as f:
            pickle.dump(self.recommender.item_map, f)
        
        # Sauvegarder le modèle
        import implicit
        implicit.utils.save_model('models/als_model.npz', self.recommender.model)
        
        print("💾 Modèle sauvegardé")


# services/ml/__init__.py

from .als_recommender import ALSRecommender
from .scheduler import MLTrainScheduler

recommender = ALSRecommender()
scheduler = MLTrainScheduler()