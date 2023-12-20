import clientPromise from "../lib/mongodb";
import {useEffect, useRef, useState} from "react";
import * as Plot from "@observablehq/plot";
import * as d3 from "d3";

export default function Weather({weather, dailyAggregate}) {
    const containerRef = useRef();
    const [data, setData] = useState();

    const plotMarksRuleY = Plot.ruleY([0])
    useEffect(() => {
        setData(weather)
    }, [weather])
    useEffect(() => {
        if (data === undefined) return;
        const plot = Plot.plot({
            width: 1400,
            marginLeft: 20,
            x: {padding: 0.4},
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
                Plot.barY(data, {x: "published_at", y: "feels_like", dx: 2, dy: 2, fill: "orange"}),
                Plot.barY(data, {x: "published_at", y: "temperature", dx: -4, dy: -4, fill: "blue"}),
                Plot.barY(data, {x: "published_at", y: "inside_temperature", dx: -12, dy: -12, fill: "green"}),

                // Plot.areaY(data, {
                //     x : "published_at",
                //     y: "temperature",
                //     fill: "inside_temperature",
                //     offset: "wiggle"
                //     // fill: "lightgrey"
                // }),
                // Plot.line(data, {
                //     x : "published_at",
                //     y: "feels_like",
                //     stroke: "black"
                // }),
                plotMarksRuleY
            ]
        });
        containerRef.current.append(plot);
        return () => plot.remove();
    }, [data]);
    return <div ref={containerRef}/>;
    // return (
    //     <div>
    //         <h1>Last 100 Weather Readings</h1>
    //         <p></p>
    //         <ul>{weather.map((reading) => (
    //             <li>
    //                 <h2>{reading.published_at}</h2>
    //                 <h3>Current condition: {reading.condition_description}</h3>
    //                 <p>Sunroom Temperature: {reading.inside_temperature}</p>
    //                 <p>Outside Temperature: {reading.temperature}</p>
    //             </li>
    //         ))}
    //         </ul>
    //     </div>
    // )
}

export async function getServerSideProps() {
    try {
        const client = await clientPromise;
        const db = client.db("weather_data");

        const weather = await db
            .collection("test")
            .find({})
            .sort({published_at: -1})
            .limit(24)
            .toArray();

        return {
            props: {
                weather: JSON.parse(JSON.stringify(weather))
            },
        };
    } catch (e) {
        console.error(e)
    }
}