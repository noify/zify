(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
			(global.vueify = factory());
}(this, function () {
	
	var uid = 0,
			watchers = [],
			repWatcher = null;

	function observe (data) {
		if (typeof data === 'object') {
			Object.keys(data).forEach(function(key) {
				var val = data[key],
						wid = uid++

				observe(val)
	
				Object.defineProperty(data, key, {
					enumerable: true, // 可枚举
					configurable: false, // 不能再define
					get: function() {
						if (repWatcher) {
							repWatcher.addWatcher(wid)
						}
						return val;
					},
					set: function(newVal) {
						if (newVal === val) {
							return;
						}
						val = newVal;
						// 新的值是object的话，进行监听
						observe(newVal);
						// 通知WatcheWr
						watchers.forEach(function(watcher) {
							watcher.update();
						});
					}
				});
			});
		}
	}

	function Watcher(vm, expOrFn, cb) {
    this.cb = cb;
    this.vm = vm;
    this.expOrFn = expOrFn;
		this.depIds = {};

    if (typeof expOrFn === 'function') {
			this.getter = expOrFn;
    } else if (!/[^\w.$]/.test(expOrFn)) { 
				var exps = expOrFn.split('.');
				this.getter = function (obj) {
					for (var i = 0, len = exps.length; i < len; i++) {
						if (!obj) return;
						obj = obj[exps[i]];
					}
					return obj;
				}
		}
		
		this.value = this.get();
	}

	Watcher.prototype = {
		addWatcher: function (id) {
			if (!this.depIds.hasOwnProperty(id)) {
				watchers.push(this)
				this.depIds[id] = null;
			}
		},
		get: function () {
			repWatcher = this;
			var value = this.getter.call(this.vm, this.vm);
			repWatcher = null;
			return value;
		},
		update: function () {
			var value = this.get();
			var oldVal = this.value;
			if (value !== oldVal) {
				this.value = value;
				this.cb.call(this.vm, value, oldVal);
			}
		},
		remove: function() {
			var index = watchers.indexOf(this);
			if (index != -1) {
				watchers.splice(index, 1);
			}
		}
	}

	var updater = {
		textUpdater: function(node, value) {
			node.textContent = typeof value == 'undefined' ? '' : value;
		},

		htmlUpdater: function(node, value) {
			node.innerHTML = typeof value == 'undefined' ? '' : value;
		},

		classUpdater: function(node, value, oldValue) {
			var className = node.className;
			className = className.replace(oldValue, '').replace(/\s$/, '');

			var space = className && String(value) ? ' ' : '';

			node.className = className + space + value;
		},

		modelUpdater: function(node, value, oldValue) {
			node.value = typeof value == 'undefined' ? '' : value;
		}
	};

	// 指令处理集合
	var compileUtil = {
		text: function(node, vm, exp) {
			this.bind(node, vm, exp, 'text');
		},

		html: function(node, vm, exp) {
			this.bind(node, vm, exp, 'html');
		},

		model: function(node, vm, exp) {
			this.bind(node, vm, exp, 'model');

			var _this = this,
					val = this._getVMVal(vm, exp);
			node.addEventListener('input', function(e) {
				var newValue = e.target.value;
				if (val === newValue) {
					return;
				}

				_this._setVMVal(vm, exp, newValue);
				val = newValue;
			});
		},

		class: function(node, vm, exp) {
			this.bind(node, vm, exp, 'class');
		},

		bind: function(node, vm, exp, dir) {
			var updaterFn = updater[dir + 'Updater'];

			updaterFn && updaterFn(node, this._getVMVal(vm, exp));

			new Watcher(vm, exp, function(value, oldValue) {
					updaterFn && updaterFn(node, value, oldValue);
			});
		},

		// 事件处理
		eventHandler: function(node, vm, exp, dir) {
			var eventType = dir.split(':')[1],
					fn = vm.$options.methods && vm.$options.methods[exp];

			if (eventType && fn) {
				node.addEventListener(eventType, fn.bind(vm), false);
			}
		},

		_getVMVal: function(vm, exp) {
				var val = vm;
				exp = exp.split('.');
				exp.forEach(function(k) {
					val = val[k];
				});
				return val;
		},

		_setVMVal: function(vm, exp, value) {
				var val = vm;
				exp = exp.split('.');
				exp.forEach(function(k, i) {
					// 非最后一个key，更新val的值
					if (i < exp.length - 1) {
						val = val[k];
					} else {
						val[k] = value;
					}
				});
		}
	}

	function node2Fragment(el) {
		var fragment = document.createDocumentFragment(),
			child;
			
		// 将原生节点拷贝到fragment
		while (child = el.firstChild) {
			fragment.appendChild(child);
		}

		
		return fragment;
	}

	function isDirective(attr) {
		return attr.indexOf('v-') == 0;
	}

	function isEventDirective(dir) {
		return dir.indexOf('on') === 0;
	}

	function isElementNode(node) {
		return node.nodeType == 1;
	}

	function isTextNode(node) {
		return node.nodeType == 3;
	}

	function compileElement (el, vm) {
		var childNodes = el.childNodes;

		[].slice.call(childNodes).forEach(function(node) {
			var text = node.textContent;
			var reg = /\{\{(.*)\}\}/;

			if (isElementNode(node)) {
				
				var nodeAttrs = node.attributes;
				
				// 处理指令
				[].slice.call(nodeAttrs).forEach(function(attr) {
					var attrName = attr.name;
					if (isDirective(attrName)) {
						var exp = attr.value;
						var dir = attrName.substring(2);
						// 事件指令
						if (isEventDirective(dir)) {
							compileUtil.eventHandler(node, vm, exp, dir);
							// 普通指令
						} else {
							compileUtil[dir] && compileUtil[dir](node, vm, exp);
						}
						node.removeAttribute(attrName);
					}
				});

			} else if (isTextNode(node) && reg.test(text)) {
				compileUtil.text(node, vm, RegExp.$1);
			}

			if (node.childNodes && node.childNodes.length) {
				compileElement(node, vm);
			}
		});
	}

	function compile(el, vm) {
		var fragment;
		el = isElementNode(el) ? el : document.querySelector(el);

		if (el) {
			fragment = node2Fragment(el);
			compileElement(fragment, vm);
			el.appendChild(fragment);
		}

	}
		
	return function render(options) {
			var _this = {};
			_this.$options = options || {};

			// 数据代理
			// 实现 vm.xxx -> vm._data.xxx
			var data =  _this._data = _this.$options.data;
			Object.keys(data).forEach(function(key) {
				Object.defineProperty(_this, key, {
					configurable: false,
					enumerable: true,
					get: function proxyGetter() {
						return data[key];
					},
					set: function proxySetter(newVal) {
						data[key] = newVal;
					}
				});
			});
			
			var computed = options.computed;
			if (typeof computed === 'object') {
				Object.keys(computed).forEach(function(key) {
					Object.defineProperty(_this, key, {
						get: typeof computed[key] === 'function' 
								? computed[key] 
								: computed[key].get,
						set: function() {}
					});
				});
			}

			observe(data, _this);
			
			compile(options.el || document.body, _this)

			_this.$watch = function (key, cb, options) {
				new Watcher(_this, key, cb);
			}

			return _this
	}

}));