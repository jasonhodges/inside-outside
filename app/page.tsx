// Import the Client Component
import HomePage from "./home-page";
import clientPromise from "../lib/mongodb";
// Opt out of caching for all data requests in the route segment
export const dynamic = 'force-dynamic'

async function getWeatherData() {
  const client = await clientPromise;
  const db = client.db("weather_data");

  const dailyAggregate = await db
    .collection("test")
    .aggregate([
      {
        // Stage 1
        $addFields: {
          // Extract hour and day from the published_at field
          hour: {
            $hour: {date: "$published_at", timezone: "America/Indiana/Indianapolis"},
          },
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$published_at",
              timezone: "America/Indiana/Indianapolis"
            },
          },
        },
      },
      {
        // Stage 2
        $addFields: {
          // Calculate the temperature difference
          temp_difference: {
            $subtract: [
              "$inside_temperature",
              "$temperature",
            ],
          },
        },
      },
      {
        // Stage 3
        $group: {
          _id: {
            day: "$day",
            hour: "$hour",
          },
          values: {
            $push: {
              count: {
                $sum: 1,
              },
              published_at: "$published_at",
              inside_temp: "$inside_temperature",
              outside_temp: "$temperature",
              temp_difference: "$temp_difference",
              condition_description:
                "$condition_description",
              condition_icon: "$condition_icon",
              daily_temp_min: {
                $min: "$temperature",
              },
              daily_temp_max: {
                $max: "$temperature",
              },
              daily_inside_temp_min: {
                $min: "$inside_temperature",
              },
              daily_inside_temp_max: {
                $max: "$inside_temperature",
              },
            },
          },
        },
      },
      {
        // Stage 4
        $unwind: "$values",
      },
      {
        // Stage 5
        $group: {
          _id: "$_id.day",
          readings: {
            $sum: "$values.count",
          },
          daily_temp_min: {
            $min: "$values.daily_temp_min",
          },
          daily_temp_max: {
            $max: "$values.daily_temp_max",
          },
          daily_inside_temp_min: {
            $min: "$values.daily_inside_temp_min",
          },
          daily_inside_temp_max: {
            $max: "$values.daily_inside_temp_max",
          },
          hourly_data: {
            $push: {
              hour: "$_id.hour",
              published_at: "$values.published_at",
              inside_temp: "$values.inside_temp",
              outside_temp: "$values.outside_temp",
              temp_difference:
                "$values.temp_difference",
              condition_description:
                "$values.condition_description",
              condition_icon:
                "$values.condition_icon",
            },
          },
        },
      },
      {
        // Stage 6
        $unwind: "$hourly_data",
      },
      {
        // Stage 7
        $sort: {
          _id: 1,
          "hourly_data.hour": 1,
        },
      },
      {
        // Stage 8
        $group: {
          _id: "$_id",
          readings: {
            $first: "$readings",
          },
          daily_temp_min: {
            $first: "$daily_temp_min",
          },
          daily_temp_max: {
            $first: "$daily_temp_max",
          },
          daily_inside_temp_min: {
            $first: "$daily_inside_temp_min",
          },
          daily_inside_temp_max: {
            $first: "$daily_inside_temp_max",
          },
          hourly_data: {
            $push: "$hourly_data",
          },
        },
      },
      {
        // Stage 9
        $sort: {
          _id: -1,
        },
      },
    ])
    .limit(9)
    .toArray();

  return JSON.parse(JSON.stringify(dailyAggregate));
}

export default async function Page() {
  const weatherData = await getWeatherData();

  return <HomePage weatherData={weatherData}/>
}