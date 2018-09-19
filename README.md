# weapp-simple-storage

[![NPM version][npm-image]][npm-url] [![changelog][changelog-image]][changelog-url] [![license][license-image]][license-url]

[npm-image]: https://img.shields.io/npm/v/weapp-simple-storage.svg?style=flat-square
[npm-url]: https://npmjs.org/package/weapp-simple-storage
[license-image]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square
[license-url]: https://github.com/ufologist/weapp-simple-storage/blob/master/LICENSE
[changelog-image]: https://img.shields.io/badge/CHANGE-LOG-blue.svg?style=flat-square
[changelog-url]: https://github.com/ufologist/weapp-simple-storage/blob/master/CHANGELOG.md

微信小程序的简单存储, 支持 TTL(time-to-live) 缓存自动过期

## 安装

```
npm install weapp-simple-storage --save
```

## 使用方法

```javascript
import SimpleStorage from 'weapp-simple-storage';
 
var simpleStorage = new SimpleStorage({
    name: '_weapp_simple_storage'
});
simpleStorage.set('key', {
    foo: 'bar'
});
simpleStorage.get('key');
```

## 配置项

### name

### loggerLevel

## API

### set

### get

### has

### delete

### clear

### keys

### setTtl

### getTtl

## Thanks

* [ZaDarkSide/simpleStorage](https://github.com/ZaDarkSide/simpleStorage)