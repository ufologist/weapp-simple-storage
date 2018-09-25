import WeappSimpleStorage from './weapp-simple-storage.js';
import TtlPlugin from './plugin/ttl-plugin.js';
import DumpPlugin from './plugin/dump-plugin.js';

WeappSimpleStorage.installPlugin(TtlPlugin);
WeappSimpleStorage.installPlugin(DumpPlugin);

export default WeappSimpleStorage;