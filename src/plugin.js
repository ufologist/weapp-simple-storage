/**
 * 缓存的插件机制
 */
class Plugin {
    /**
     * @abstract
     * 
     * @param {obbject} pluginOptions 插件的配置项
     */
    constructor(pluginOptions) {}
    /**
     * @abstract
     * 
     * @param {WeappSimpleStorage} simpleStorageInstance 
     * @param {string} key 
     * @param {*} newValue 设置缓存数据时的新值
     * @param {object} setOptions 设置缓存数据时的配置项
     * @param {*} oldValue 设置缓存数据时的老值
     */
    onSet(simpleStorageInstance, key, newValue, setOptions, oldValue) {}
    /**
     * @abstract
     * 
     * @param {WeappSimpleStorage} simpleStorageInstance 
     * @param {*} key 
     * @param {*} value 
     * @return {*}
     */
    onGet(simpleStorageInstance, key, value) {
        return value;
    }
    // onDelete(simpleStorageInstance, key) {}
    // onClear(simpleStorageInstance) {}
}
Plugin.pluginName = 'plugin';

export default Plugin;