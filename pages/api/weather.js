import clientPromise from "../../lib/mongodb";

export default async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db("weather_data");

        const weather = await db
            .collection("test")
            .find({})
            .sort({published_at: -1})
            .limit(200)
            .toArray();

        res.json(weather);
    } catch (e) {
        console.error(e);
    }
};