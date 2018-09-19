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
        this._options = extend(true, {}, WeappSimpleStorage.defaults, options);

        this._name = this._options.name;
        this._meta = '_meta_' + this._name;

        this._storage = null;
        this._initSuccess = false;

        this._initStorage();
        this._syncStorage2Memory();

        this.logger = new Logger({
            level: this._options.loggerLevel,
            prefix: `[${this._name}]`
        });
    }

    _initStorage() {
        this._storage = {
            [this._meta]: this.getInitMeta()
        };
    }

    _syncStorage2Memory() {
        try {
            var storage = wx.getStorageSync(this._name);

            if (storage) {
                this._storage = storage;
            }

            this._initSuccess = true;
        } catch (error) {
            this.logger.error('WeappSimpleStorage 同步缓存数据失败', error)
        }
    }

    /**
     * 将内存数据异步写入到缓存
     */
    _syncMemory2Storage(options) {
        wx.setStorage(extend({
            key: this._name,
            data: this._storage
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

    onSet(key, newValue, oldValue) {
        this._syncMemory2Storage({
            success: () => {
                this.logger.log('onSet success', key, newValue, oldValue);
            },
            fail: () => {
                this.logger.warn('onSet fail', key, newValue, oldValue);
            }
        });
    }

    onDelete(key) {
        this._syncMemory2Storage({
            success: () => {
                this.logger.log('onDelete success', key);
            },
            fail: () => {
                this.logger.warn('onDelete fail', key);
            }
        });
    }

    onClear() {
        this._syncMemory2Storage({
            success: () => {
                this.logger.log('onClear success');
            },
            fail: () => {
                this.logger.warn('onClear fail');
            }
        });
    }

    set(key, value, options = {}) { // simpleStorage.get
        var oldValue = this._storage[key];

        this._storage[key] = value;
        this.setTtl(key, options.ttl);

        this.onSet(key, value, oldValue)
    }
    get(key) { // simpleStorage.set
        var value = this._storage[key];
        var ttl = this.getTtl(key);

        // 缓存是否过期
        if (typeof ttl !== 'undefined' && ttl < Date.now()) {
            var result = this.delete(key);
            if (result) {
                value = undefined;
            } else {
                this.logger.warn('删除过期缓存失败', key, ttl);
            }
        }

        return value;
    }
    has(key) { // simpleStorage.hasKey
        return typeof this.get(key) != undefined;
    }
    /**
     * 
     * @return {boolean}
     */
    delete(key) { // simpleStorage.deleteKey
        var result = delete this._storage[key];
        this.onDelete(key);
        return result;
    }
    clear() { // simpleStorage.flush
        this._initStorage();
        this.onClear();
    }

    setTtl(key, ttl) { // simpleStorage.setTTL
        if (typeof ttl !== 'undefined') {
            ttl = Date.now() + parseInt(ttl) ? parseInt(ttl) : 0;
            this._storage[this._meta][key] = ttl;
        }
    }
    getTtl(key) { // simpleStorage.getTTL
        return this._storage[this._meta][key];
    }

    /**
     * 
     * @return {Array<string>}
     */
    keys() { // simpleStorage.index
        return Object.keys(this._storage).filter((key) => {
            return key !== this._meta;
        });
    }
}

WeappSimpleStorage.defaults = {
    name: '_weapp_simple_storage',
    loggerLevel: Logger.LEVEL_WARN
};

export default WeappSimpleStorage;