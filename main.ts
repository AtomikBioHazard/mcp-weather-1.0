import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const server = new McpServer({
  name: 'Weather Server',
  version: '1.0.0'
})

server.tool(
  'get-weather',
  'Tool to get the weather from any city',
  {
    city: z.string().describe('The name of the city to get the weather'),
  },
  async ({ city }) => {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`)

    if (!response.ok) {
      return {
        content: [
          {
            type: 'text',
            text: `Couldn't get weather info for ${city}. Retry again later.`
          }
        ]
      }
    }

    const data = await response.json()

    if (!data || !data.results || data.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `Couldn't find results for ${city}. Verify the name of the city.`
          }
        ]
      }
    }

    const { latitude, longitude } = data.results[0];

    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code,relative_humidity_2m,apparent_temperature,precipitation_probability,rain&forecast_days=3`)

    if (!weatherResponse.ok) {
      return {
        content: [
          {
            type: 'text',
            text: `Couldn't fetch weather data for ${city}. Weather service unavailable.`
          }
        ]
      }
    }

    const weatherData = await weatherResponse.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(weatherData, null, 2)
        }
      ]
    }
  }
)

const transport = new StdioServerTransport();
server.connect(transport);