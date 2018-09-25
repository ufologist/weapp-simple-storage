import WeappSimpleStorage from '../weapp-simple-storage.js';
import Plugin from '../plugin.js';

/**
 * 实现 TTL 缓存机制的插件
 * 
 * - 在设置缓存数据时添加 options.ttl 来设置缓存数据的存活时长
 * - 提供 setTtl(key, ttl)/getTtl(key) 来设置和获取缓存数据的存活时长
 */
class TtlPlugin extends Plugin {
    constructor(pluginOptions) {
        super(pluginOptions);

        /**
         * 设置缓存的存活时长(ms)
         * 
         * @param {string} key 
         * @param {undefined|number} ttl 缓存的存活时长(ms), 当 TTL 有值的时候设置 TTL, 没值的时候清空 TTL
         */
        WeappSimpleStorage.prototype.setTtl = function(key, ttl) { // simpleStorage.setTTL
            if (ttl) {
                ttl = Date.now() + (parseInt(ttl) ? parseInt(ttl) : 0);
                this.setMeta(TtlPlugin.pluginName, key, ttl);
            } else {
                this.setMeta(TtlPlugin.pluginName, key);
            }
        };

        /**
         * 获取缓存的存活时间(ms)
         * 
         * @param {string} key
         * @return {number|undefined} 缓存的存活时间(ms)
         */
        WeappSimpleStorage.prototype.getTtl = function(key) { // simpleStorage.getTTL
            return this.getMeta(TtlPlugin.pluginName, key);
        };
    }

    onSet(simpleStorageInstance, key, newValue, setOptions, oldValue) {
        simpleStorageInstance.setTtl(key, setOptions[TtlPlugin.pluginName]);
    }

    onGet(simpleStorageInstance, key, value) {
        // 有缓存数据再检查缓存数据是否过期
        if (typeof value != 'undefined') {
            var ttl = simpleStorageInstance.getTtl(key);
            if (typeof ttl !== 'undefined' && ttl < Date.now()) {
                var result = simpleStorageInstance.delete(key);
                if (result) {
                    value = undefined;
                } else {
                    simpleStorageInstance.logger.warn('删除过期的缓存失败', key, ttl);
                }
            }
        }

        return value;
    }
}
TtlPlugin.pluginName = 'ttl';

export default TtlPlugin;