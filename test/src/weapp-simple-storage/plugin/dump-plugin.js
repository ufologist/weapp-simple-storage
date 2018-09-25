import WeappSimpleStorage from '../weapp-simple-storage.js';
import Plugin from '../plugin.js';

/**
 * 获取缓存数据的所有内容(包括元数据)
 * 
 * - 提供 dump(key) 来获取缓存数据
 */
class DumpPlugin extends Plugin {
    constructor(pluginOptions) {
        super(pluginOptions);

        /**
         * 获取缓存数据的所有内容(包括元数据)
         * 
         * @param {string|undefined} key
         * @return {*}
         */
        WeappSimpleStorage.prototype.dump = function(key) {
            var content = undefined;

            if (key) {
                var value = this.storage[key];
                if (value) {
                    content = JSON.parse(JSON.stringify(value));

                    for (var name in this.storage[this.meta]) {
                        if (this.hasMeta(name)) {
                            content[`[${name}]`] = this.getMeta(name, key);
                        }
                    }
                }
            } else {
                content = JSON.parse(JSON.stringify(this.storage));
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
        };
    }
}
DumpPlugin.pluginName = 'dump';

export default DumpPlugin;