'use client' // Client Component
import {Metadata} from 'next'
import Image from 'next/image';
import {AreaChart, Card, Grid, Tab, TabGroup, TabList, TabPanel, TabPanels, Text, Title} from "@tremor/react";
import {format, parse, parseISO, parseJSON} from "date-fns";
import {getTimezoneOffset, utcToZonedTime, format as formatTz} from 'date-fns-tz';

export const metadata: Metadata = {
  title: 'My HomePage Title',
}

const dateHelper = (dateString: string) => {
  const inputString = dateString.replace('Z', 'Z');
  const inputDate = parseISO(inputString);
  // Identify whether the date is in daylight saving time (DST)
  const isDST = getTimezoneOffset('America/Indiana/Indianapolis', inputDate) !== getTimezoneOffset('America/Indiana/Indianapolis', new Date(2023, 1, 1));
  // Determine the correct timezone for the date
  const timezone = isDST ? 'America/Indiana/Indianapolis' : 'EST';
  // Convert the UTC time to the specified timezone
  const zonedDate = utcToZonedTime(inputDate, timezone);

// Format the zoned date according to the specified format string
  const formattedHour = formatTz(zonedDate, 'h aaa', { timeZone: timezone });

  return formattedHour;
}
const customTooltip = ({payload, active}) => {
  if (!active || !payload) return null;
  return (
    <div className="w-56 rounded-tremor-default text-tremor-default bg-dark-tremor-background-emphasis p-1 shadow-tremor-dropdown border border-tremor-border">
      <div className="flex justify-between items-center">
        <Image
          src={`https://openweathermap.org/img/wn/${payload[0].payload.condition_icon}@2x.png`}
          width={30}
          height={30}
          alt="Icon of weather condition"
          className="w-10 flex-none"
        />
        <p className="flex">{payload[0].payload.condition_description}</p>
        <p className="flex-none w-10">{dateHelper(payload[0].payload.published_at)}</p>
      </div>
      {payload.map((category, idx) => (
        <div key={idx} className="flex flex-1 space-x-2.5">
          <div className={`w-1 flex bg-${category.color}-500 rounded`} />
          <div className="flex space-x-4">
            <p className="w-20 flex-none text-tremor-content">{category.dataKey}</p>
            <p className="font-medium text-tremor-content-emphasis">{category.value}°F</p>
          </div>
        </div>
      ))}
      <div className="flex flex-1 space-x-2.5">
        <div className={`w-1 flex bg-red-500 rounded`} />
        <div className="flex space-x-4">
          <p className="w-20 flex-none text-tremor-content">difference</p>
          <p className="font-medium text-tremor-content-emphasis">{payload[0].payload.temp_difference.toFixed(2)}°F</p>
        </div>
      </div>
    </div>
  )
}

const valueFormatter = function(number: { toString: () => string; }) {
  let tempString = number.toString();
  return tempString.concat('°F');
}


export default function HomePage({weatherData}: any) {
  console.log(weatherData)
  return (
    <main>
      <Title>Dashboard</Title>
      <Text>Weather comparison for inside vs. outside</Text>

      <TabGroup className="mt-6">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Detail</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Grid numItemsMd={2} numItemsLg={3} className="mt-6 gap-6">
              {weatherData.map((d) => (
                <Card key={d._id}>
                    <Title>{format(parseISO(d._id), "EEEE MMM. d, yyyy")}</Title>
                    <AreaChart
                      className="h-72 mt-4"
                      data={d.hourly_data}
                      index="hour"
                      yAxisWidth={34}
                      showAnimation={true}
                      customTooltip={customTooltip}
                      valueFormatter={valueFormatter}
                      colors={["emerald", "sky"]}
                      categories={["inside_temp", "outside_temp"]}></AreaChart>
                </Card>
              ))}
            </Grid>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </main>
  )
}