import Plugin from '../plugin.js';

/**
 * 记录缓存数据的新增和更新时间
 */
class TimePlugin extends Plugin {
    constructor(pluginOptions) {
        super(pluginOptions);
    }

    onSet(simpleStorageInstance, key, newValue, setOptions, oldValue) {
        if (typeof oldValue === 'undefined') {
            simpleStorageInstance.setMeta(TimePlugin.pluginName, key, {
                createTime: new Date()
            });
        } else {
            var time = simpleStorageInstance.getMeta(TimePlugin.pluginName, key);
            if (time) {
                time.updateTime = new Date();
            } else {
                time = {
                    updateTime: new Date()
                };
            }
            simpleStorageInstance.setMeta(TimePlugin.pluginName, key, time);
        }
    }
}
TimePlugin.pluginName = 'time';

export default TimePlugin;