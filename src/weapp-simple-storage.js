import Logger from 'simple-console-log-level';
import extend from 'extend';

import Plugin from './plugin.js';

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
     *                 options.name {string} name 存储的名称, 默认为: _weapp_simple_storage, 后续所有的存储都挂在这个 key 值上
     *                 options.loggerLevel {string} 日志级别, 默认为: Logger.LEVEL_WARN 
     */
    constructor(options) {
        this.options = extend(true, {}, WeappSimpleStorage.defaults, options);

        /**
         * 存储所有数据的 key 值的名称
         */
        this.name = this.options.name;
        /**
         * 存储所有元数据的 key 值的名称 
         */
        this.meta = '_meta_' + this.name;

        /**
         * 同步到内存中的存储数据
         */
        this.storage = null;
        /**
         * 初始化是否成功
         */
        this.initSuccess = false;

        this.initStorage();
        this.syncStorage2Memory();

        /**
         * 日志
         */
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
            [this.meta]: {}
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

        // [this, arguments, oldValue]
        var args = [this, key, value, options, oldValue];
        WeappSimpleStorage.plugins.forEach((plugin) => {
            try {
                plugin.onSet.apply(plugin, args);
            } catch (error) {
                this.logger.warn('插件', plugin, 'onSet', error, plugin.constructor.pluginName || plugin.constructor.name, args);
            }
        });

        this.onSet(key, this.storage[key], oldValue);
    }
    /**
     * 获取某个缓存
     * 
     * @param {string} key
     * @return {*}
     */
    get(key) { // simpleStorage.set
        var value = this.storage[key];

        // 串联所有插件, 将处理后的 value 一个接一个的传递下去
        // plugin1 -onGet-> value1 -> plugin2 -onGet-> value2 -> plugin3 ....
        value = WeappSimpleStorage.plugins.reduce((prev, plugin) => {
            // [this, arguments, value]
            var args = [this, key, prev];

            var pluginOnGetResult = prev;
            try {
                pluginOnGetResult = plugin.onGet.apply(plugin, args);
            } catch (error) {
                this.logger.warn('插件', plugin, 'onGet', error, plugin.constructor.pluginName || plugin.constructor.name, args);
            }

            return pluginOnGetResult;
        }, value);

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
     * 获取元数据
     * 
     * @param {string} name 元数据的名称
     * @param {string} key 
     * @return {*} 元数据
     */
    getMeta(name, key) {
        var metaValue = undefined;

        if (this.hasMeta(name)) {
            metaValue = this.storage[this.meta][name][key];
        }

        return metaValue;
    }
    /**
     * 是否有元数据
     * 
     * @param {string} name 
     * @return {boolean}
     */
    hasMeta(name) {
        return typeof this.storage[this.meta][name] !== 'undefined';
    }
    /**
     * 设置元数据
     * 
     * @param {string} name 元数据的名称
     * @param {string} key 
     * @param {*} value 如果 value 不为 undefined 则设置元数据, 否则删除元数据
     * @return {boolean}
     */
    setMeta(name, key, value) {
        var oldValue = this.getMeta(name, key);

        // 如果还没有该元数据, 则需要初始化元数据
        if (!this.hasMeta(name)) {
            this.storage[this.meta][name] = {};
        }

        var result = true;
        if (typeof value !== 'undefined') {
            this.storage[this.meta][name][key] = value;
        } else {
            result = delete this.storage[this.meta][name][key];
        }

        if (result) {
            this.onSet(key, name + ':' + value, name + ':' + oldValue);
        } else {
            this.logger.warn('设置元数据失败', name, key, value);
        }

        return result;
    }

    /**
     * 获取缓存数据的所有内容(包括元数据)
     * 
     * @param {string|undefined} key
     * @return {*}
     */
    $getContent(key) {
        var content = undefined;

        if (key) {
            var value = this.get(key);
            if (value) {
                content = value;
                for (var name in this.storage[this.meta]) {
                    if (this.hasMeta(name)) {
                        content[`[${name}]`] = this.getMeta(name, key);
                    }
                }
            }
        } else {
            content = extend(true, this.storage);
            for (var key in content) {
                for (var name in this.storage[this.meta]) {
                    if (this.hasMeta(name)) {
                        content[key][`[${name}]`] = this.getMeta(name, key);
                    }
                }
            }

            delete content[this.meta];
        }

        return content;
    }
}

WeappSimpleStorage.defaults = {
    name: '_weapp_simple_storage',
    loggerLevel: Logger.LEVEL_WARN
};

/**
 * 安装的插件
 */
WeappSimpleStorage.plugins = [];

/**
 * 安装插件
 * 
 * @param {Plugin} Plugin 
 * @param {object} pluginOptions 
 */
WeappSimpleStorage.installPlugin = function(Plugin, pluginOptions) {
    WeappSimpleStorage.plugins.push(new Plugin(pluginOptions));
}

export default WeappSimpleStorage;