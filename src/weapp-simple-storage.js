import Logger from 'simple-console-log-level';
import extend from 'extend';

/**
 * 微信小程序的简单存储
 * 
 * - 支持 TTL(time-to-live) 缓存自动过期
 * 
 * @example
 * import SimpleStorage from 'weapp-simple-storage';
 * 
 * var simpleStorage = new SimpleStorage({
 *     name: '_weapp_simple_storage'
 * });
 * simpleStorage.set('key', {
 *     foo: 'bar'
 * });
 * 
 * @see https://github.com/ZaDarkSide/simpleStorage
 */
class WeappSimpleStorage {
    /**
     * 
     * @param {object} options
     *                 options.name {string} name 存储的名称, 默认为: _weapp_simple_storage, 后续所有的存储都挂在这个 key 值上, 会自动追加上时间戳防止 key 冲突
     *                 options.loggerLevel {string} 日志级别, 默认为: Logger.LEVEL_WARN 
     */
    constructor(options) {
        this.options = extend(true, {}, WeappSimpleStorage.defaults, options);

        this.name = this.options.name;
        this.meta = '_meta_' + this.name;

        this.storage = null;
        this.initSuccess = false;

        this.initStorage();
        this.syncStorage2Memory();

        this.logger = new Logger({
            level: this.options.loggerLevel,
            prefix: `[${this.name}]`
        });
    }

    /**
     * 初始化默认的缓存数据
     */
    initStorage() {
        this.storage = {
            [this.meta]: this.getInitMeta()
        };
    }

    /**
     * 将缓存存储中的数据同步到内存中
     * 后续所有的操作都走内存, 避免需要同步的操作缓存, 内存中的数据会异步写回到缓存存储中
     */
    syncStorage2Memory() {
        try {
            var storage = wx.getStorageSync(this.name);

            if (storage) {
                this.storage = storage;
            }

            this.initSuccess = true;
        } catch (error) {
            this.logger.error('WeappSimpleStorage 将缓存存储中的数据同步到内存中失败', error)
        }
    }

    /**
     * 将内存中的缓存数据异步写入到缓存存储中
     * 
     * @param {object} options wx.setStorage 的参数
     */
    syncMemory2Storage(options) {
        wx.setStorage(extend({
            key: this.name,
            data: this.storage
        }, options));
    }

    /**
     * 获取元数据, 可以扩展这里实现更多功能
     * 
     * @return {object} 存储的元数据
     */
    getInitMeta() {
        return {
            ttl: {}
        };
    }

    /**
     * 当设置缓存时的事件
     * 
     * @param {string} key 
     * @param {*} newValue 
     * @param {*} oldValue 
     */
    onSet(key, newValue, oldValue) {
        this.syncMemory2Storage({
            success: () => {
                this.logger.log('onSet success', key, newValue, '<-', oldValue);
            },
            fail: () => {
                this.logger.warn('onSet fail', key, newValue, '<-', oldValue);
            }
        });
    }

    /**
     * 当删除缓存时的事件
     * 
     * @param {string} key 
     */
    onDelete(key) {
        this.syncMemory2Storage({
            success: () => {
                this.logger.log('onDelete success', key);
            },
            fail: () => {
                this.logger.warn('onDelete fail', key);
            }
        });
    }

    /**
     * 当清除缓存时的事件
     */
    onClear() {
        this.syncMemory2Storage({
            success: () => {
                this.logger.log('onClear success');
            },
            fail: () => {
                this.logger.warn('onClear fail');
            }
        });
    }

    /**
     * 设置某个缓存
     * 
     * @param {string} key 
     * @param {*} value 
     * @param {object} options 
     */
    set(key, value, options = {}) { // simpleStorage.get
        var oldValue = this.storage[key];

        this.storage[key] = value;
        this.setTtl(key, options.ttl);

        this.onSet(key, value, oldValue);
    }
    /**
     * 获取某个缓存
     * 
     * @param {string} key
     * @return {*}
     */
    get(key) { // simpleStorage.set
        var value = this.storage[key];

        // 有缓存数据再检查缓存数据是否过期
        if (typeof value != 'undefined') {
            var ttl = this.getTtl(key);
            if (typeof ttl !== 'undefined' && ttl < Date.now()) {
                var result = this.delete(key);
                if (result) {
                    value = undefined;
                } else {
                    this.logger.warn('删除过期的缓存失败', key, ttl);
                }
            }
        }

        return value;
    }
    /**
     * 删除某个缓存
     * 
     * @param {string} key
     * @return {boolean}
     */
    delete(key) { // simpleStorage.deleteKey
        this.setTtl(key);
        var result = delete this.storage[key];

        if (result) {
            this.onDelete(key);
        } else {
            this.logger.warn('删除缓存失败', key);
        }

        return result;
    }
    /**
     * 清除所有缓存
     */
    clear() { // simpleStorage.flush
        this.initStorage();
        this.onClear();
    }
    /**
     * 是否存在某个缓存
     * 
     * @param {string} key
     * @return {boolean}
     */
    has(key) { // simpleStorage.hasKey
        return typeof this.get(key) !== 'undefined';
    }

    /**
     * 获取缓存中的所有 key 值
     * 
     * @return {Array<string>}
     */
    keys() { // simpleStorage.index
        return Object.keys(this.storage).filter((key) => {
            return key !== this.meta;
        });
    }

    /**
     * 设置缓存的存活时长(ms)
     * 
     * @param {string} key 
     * @param {undefined|number} ttl 缓存的存活时长(ms), 当 TTL 有值的时候设置 TTL, 没值的时候清空 TTL
     */
    setTtl(key, ttl) { // simpleStorage.setTTL
        var oldTtl = this.getTtl(key);

        if (ttl) {
            ttl = Date.now() + (parseInt(ttl) ? parseInt(ttl) : 0);
            this.storage[this.meta].ttl[key] = ttl;

            this.onSet(key, 'ttl:' + ttl, 'ttl:' + oldTtl);
        } else {
            var result = delete this.storage[this.meta].ttl[key];
            if (result) {
                this.onSet(key, 'ttl:' + ttl, 'ttl:' + oldTtl);
            } else {
                this.logger.warn('清除 TTL 失败', key);
            }
        }
    }
    /**
     * 获取缓存的存活时间(ms)
     * 
     * @param {string} key
     * @return {number|undefined} 缓存的存活时间(ms)
     */
    getTtl(key) { // simpleStorage.getTTL
        return this.storage[this.meta].ttl[key];
    }
}

WeappSimpleStorage.defaults = {
    name: '_weapp_simple_storage',
    loggerLevel: Logger.LEVEL_WARN
};

export default WeappSimpleStorage;