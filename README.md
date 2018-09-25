# weapp-simple-storage

[![NPM version][npm-image]][npm-url] [![changelog][changelog-image]][changelog-url] [![license][license-image]][license-url]

[npm-image]: https://img.shields.io/npm/v/weapp-simple-storage.svg?style=flat-square
[npm-url]: https://npmjs.org/package/weapp-simple-storage
[license-image]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square
[license-url]: https://github.com/ufologist/weapp-simple-storage/blob/master/LICENSE
[changelog-image]: https://img.shields.io/badge/CHANGE-LOG-blue.svg?style=flat-square
[changelog-url]: https://github.com/ufologist/weapp-simple-storage/blob/master/CHANGELOG.md

微信小程序的简单缓存存储, 支持 TTL(time-to-live) 缓存自动过期

## Installation

```
npm install weapp-simple-storage --save
```

## Example usage

```javascript
import SimpleStorage from 'weapp-simple-storage';
 
var simpleStorage = new SimpleStorage({
    name: '_weapp_simple_storage'
});

simpleStorage.set('key', {
    foo: 'bar'
}, {
    ttl: 60000
});
simpleStorage.get('key');
simpleStorage.has('key');
simpleStorage.delete('key');
simpleStorage.clear();
```

## 数据结构

所有的缓存数据都存储在微信小程序缓存存储的一个 key 上面

```javascript
{
    "name": {             // new SimpleStorage({ name: 'name' });
        "key1": "value1"  // simpleStorage.set('key1', 'value1');
        "key2": "value2"  // simpleStorage.set('key2', 'value2');
        "_meta_name": {
            "meta1": {
                "key1": "meta1-value1" // simpleStorage.setMeta('meta1', 'key1', 'meta1-value1');
                "key2": "meta1-value2" // simpleStorage.setMeta('meta1', 'key2', 'meta1-value2');
            },
            "meta2": {
                "key1": "meta2-value1" // simpleStorage.setMeta('meta2', 'key1', 'meta2-value1');
                "key2": "meta2-value2" // simpleStorage.setMeta('meta2', 'key2', 'meta2-value2');
            }
        }
    }
}
```

## options

### options.name

存储所有缓存数据的 key 值的名称

### options.loggerLevel

日志级别, 默认为 `WARN` 级别, 具体级别请查看 [simple-console-log-level](https://github.com/ufologist/simple-console-log-level)

## API

### set(key: string, value: any, options: object): void

设置某个缓存

### get(key: string): any

获取某个缓存

### has(key: string): boolean

是否存在某个缓存

### delete(key: string): boolean

删除某个缓存

### clear(): void

清除所有缓存

### keys(): Array<string>

获取缓存中的所有 key 值

### setMeta(name: string, key: string, value: any): boolean

设置元数据

### getMeta(name: string, key: string): any

获取元数据

### hasMeta(name: string): boolean

是否有元数据

### setTtl(key: string, ttl: number) 由 TtlPlugin 提供

设置缓存的存活时长(ms)

### getTtl(key: string): number 由 TtlPlugin 提供

获取缓存的存活时间(ms)

## Plugin

* [Plugin](https://github.com/ufologist/weapp-simple-storage/blob/master/src/plugin.js) 缓存的插件机制
* [TtlPlugin](https://github.com/ufologist/weapp-simple-storage/blob/master/src/plugin/ttl-plugin.js) TTL 缓存机制的插件
* [DumpPlugin](https://github.com/ufologist/weapp-simple-storage/blob/master/src/plugin/dump-plugin.js) 获取缓存数据的所有内容(包括元数据)
* [TimePlugin](https://github.com/ufologist/weapp-simple-storage/blob/master/src/plugin/time-plugin.js) 记录缓存数据的新增和更新时间

## Thanks

* [ZaDarkSide/simpleStorage](https://github.com/ZaDarkSide/simpleStorage)
* [Store.js](https://github.com/marcuswestin/store.js)