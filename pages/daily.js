import clientPromise from "../lib/mongodb";
import {useEffect, useRef, useState} from "react";
import * as Plot from "@observablehq/plot";
import * as d3 from "d3";

export default function Weather({daily}) {
    const containerRef = useRef();
    const [data, setData] = useState();

    useEffect(() => {
        setData(daily[0])
    }, [daily])
    console.log('*****DATA:', data)
    useEffect(() => {
        if (data === undefined) return;
        const plot = Plot.plot({
            width: 1400,
            marginLeft: 20,
            // x: {padding: 0.4},
            y: {
                axis: "left",
                tickSize: 0,
                tickPadding: 7,
                grid: true,
                nice: true,
                labelOffset: 0,
                label: "Temperature (°F)"
            },
            marks: [
                Plot.ruleY([0]),
                // [data].map((dd) => Plot.lineY(dd, {x: "hour", y: "daily_inside_temp_min"}))
                // Plot.line(data.hourly_data, Plot.windowY(24, {x: "hour", y: "outside_temp", stroke: "#4e79a7" })),
                Plot.lineY(data.hourly_data, {x: "hour", y: "outside_temp", stroke: "#4e79a7" , marker: "circle"}),
                Plot.areaY(data.hourly_data, {x: "hour", y: "outside_temp", fillOpacity: 0.1 }),
                // Plot.line(data.hourly_data, Plot.windowY(24, {x: "hour", y: "inside_temp", stroke: "#e15759" })),
                Plot.lineY(data.hourly_data, {x: "hour", y: "inside_temp", stroke: "#e15759", marker: "circle" }),
                Plot.areaY(data.hourly_data, {x: "hour", y: "inside_temp", fillOpacity: 0.1 }),

                // Plot.areaY(data.hourly_data, {x: "hour", y1: "inside_temp", y2: "outside_temp"})
                // Plot.areaY(data.hourly_data, {x: "hour", y2: "unemployed", z: "industry", fillOpacity: 0.1}),
                // Plot.lineY(data.hourly_data, {x: "hour", y: "unemployed", z: "industry", strokeWidth: 1})
                // Plot.differenceY(data.hourly_data, {x: "hour", y1: "outside_temp", y2: "inside_temp"})
                // Plot.barY(data, {x: "published_at", y: "temperature", dx: -4, dy: -4, fill: "blue"}),
                // Plot.barY(data, {x: "published_at", y: "inside_temperature", dx: -12, dy: -12, fill: "green"}),
                // plotMarksRuleY
            ]
        });
        containerRef.current.append(plot);
        return () => plot.remove();
    }, [data]);
    return <div ref={containerRef}/>;
}

export async function getServerSideProps() {
    try {
        const client = await clientPromise;
        const db = client.db("weather_data");

        const dailyAggregate = await db
            .collection("test")
            .aggregate([
                {
                    $addFields: {
                        // Extract hour and day from the published_at field
                        hour: {
                            $hour: "$published_at",
                        },
                        day: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$published_at",
                            },
                        },
                    },
                },
                {
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
                    $unwind: "$values",
                },
                {
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
                            },
                        },
                    },
                },
                {
                    $unwind: "$hourly_data",
                },
                {
                    $sort: {
                        _id: 1,
                        "hourly_data.hour": 1,
                    },
                },
                {
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
                    $sort: {
                        _id: -1,
                    },
                },
            ])
            .limit(5)
            // .toArray();


        console.log(JSON.parse(JSON.stringify(dailyAggregate)));
        return {
            props: {
                daily: JSON.parse(JSON.stringify(dailyAggregate))
            },
        };
    } catch (e) {
        console.error(e)
    }
}