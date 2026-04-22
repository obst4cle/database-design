import app from './app.js'
import { config } from './config.js'

app.listen(config.port, () => {
  console.log(`shared-bike-dispatch-backend running at http://localhost:${config.port}`)
})
