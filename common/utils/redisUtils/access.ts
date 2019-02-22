import { config } from '../../config'
import * as Model from '../../interface'
import { createHandyClient } from 'handy-redis'

export class RedisAccessUtils {
    public async getKey(key: string) {
        let client = createHandyClient({
            host: config.stgRedis.host,
            port: config.stgRedis.port
        })
        try {
            const res = await client.get(key)
            if (!res) {
                throw 'Cannot get data on Redis!'
            }
            return JSON.parse(res)
        } catch (err) {
            throw { message: 'Error with Redis!', error: err }
        } finally {
            await client.quit()
        }
    }

    public async setValue(key: string, value: string) {
        let client = createHandyClient({
            host: config.stgRedis.host,
            port: config.stgRedis.port
        })
        try {

            const res = await client.set(key, value)
            if (res != 'OK') {
                throw 'Cannot update data on Redis!'
            }
        } catch (err) {
            throw { message: 'Error with Redis!', error: err }
        } finally {
            await client.quit()
        }
    }
}