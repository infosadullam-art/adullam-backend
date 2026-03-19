import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const APP_KEY = process.env.ALIEXPRESS_APP_KEY!;
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Exemple CategoryId (remplace par un vrai ID si tu veux)
    const categoryId = req.query.categoryId || "200003482"; // exemple Electronics

    // On récupère 40 produits
    const url = `https://gw.api.alibaba.com/openapi/param2/1/aliexpress.category.dropshipping.product.list/${APP_KEY}`;
    const params = {
      categoryId,
      page: 1,
      pageSize: 40,
    };

    const response = await axios.get(url, { params });

    // Affiche les 40 produits pour test
    const products = response.data.products || [];

    res.status(200).json({ success: true, count: products.length, products });
  } catch (err: any) {
    console.error("Erreur test API:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}
