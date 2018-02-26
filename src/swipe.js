(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
      (global.swipe = factory());
}(this, function () {
  var on = (function() {
    if(document.addEventListener) {
      return function(element, event, handler) {
        if (element && event && handler) {
          element.addEventListener(event, handler, false);
        }
      };
    } else {
      return function(element, event, handler) {
        if (element && event && handler) {
          element.attachEvent('on' + event, handler);
        }
      };
    }
  })();
  
  var off = (function() {
    if(document.removeEventListener) {
      return function(element, event, handler) {
        if (element && event) {
          element.removeEventListener(event, handler, false);
        }
      };
    } else {
      return function(element, event, handler) {
        if (element && event) {
          element.detachEvent('on' + event, handler);
        }
      };
    }
  })();
  
  var once = function(el, event, fn) {
    var listener = function() {
      if (fn) {
        fn.apply(this, arguments);
      }
      off(el, event, listener);
    };
    on(el, event, listener);
  };

  var trim = function (string) {
    return (string || '').replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, '');
  };
  
  var hasClass = function (el, cls) {
    if (!el || !cls) return false;
    if (cls.indexOf(' ') != -1) throw new Error('className should not contain space.');
    if (el.classList) {
      return el.classList.contains(cls);
    } else {
      return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') > -1;
    }
  };
  
  var addClass = function (el, cls) {
    if (!el) return;
    var curClass = el.className;
    var classes = (cls || '').split(' ');
  
    for (var i = 0, j = classes.length; i < j; i++) {
      var clsName = classes[i];
      if (!clsName) continue;
  
      if (el.classList) {
        el.classList.add(clsName);
      } else {
        if (!hasClass(el, clsName)) {
          curClass += ' ' + clsName;
        }
      }
    }
    if (!el.classList) {
      el.className = curClass;
    }
  };
  
  var removeClass = function (el, cls) {
    if (!el || !cls) return;
    var classes = cls.split(' ');
    var curClass = ' ' + el.className + ' ';
  
    for (var i = 0, j = classes.length; i < j; i++) {
      var clsName = classes[i];
      if (!clsName) continue;
  
      if (el.classList) {
        el.classList.remove(clsName);
      } else {
        if (hasClass(el, clsName)) {
          curClass = curClass.replace(' ' + clsName + ' ', ' ');
        }
      }
    }
    if (!el.classList) {
      el.className = trim(curClass);
    }
  };
  var state = {
    dragState: {}, // 拖动状态
    ready: false,// 准备状态
    dragState: {}, // 拖动状态
    ready: false, // 准备状态
    dragging: false, // 拖动中
    userScrolling: false, // 用户滚动
    animating: false, // 动画中
    index: 0, // 当前页数
    pages: [], // 所有子组件的根
    timer: null, // 自动轮播的时间器
    reInitTimer: null,
    noDrag: false, // 禁止拖动
  },
    option = {
      speed:  300, // 轮播速度
      auto:  3000, // 多少毫秒自动滚动一次
      loop:  true, // 循环滚动
      pagination:  true, // 显示分页器
      noDragWhenSingle:  true, // 当单独的时候禁止拖动
      prevent:  false, // 阻止拖动
    },
    $children, $el
      
  function swipe (container, options) {
    if (!container) return;
    var element = container.children[0];
    var slides, slidePos, width, length;
    options = options || {};
    var index = parseInt(options.startSlide, 10) || 0; // 初始页
    var speed = options.speed || 300; // 轮播速度
    options.continuous = options.continuous !== undefined ? options.continuous : true;// 循环滚动
  
    prevent = option.prevent || false // 阻止拖动
    init()
  }
  function init () { // 初始化
    state.ready = true
    $children = document.getElementsByClassName('swiper-slide')
    
    $el = document.getElementsByClassName('swipe-container')[0]
    console.log($el)
    if (option.auto > 0) {
      state.timer = setInterval(() => {
        if (!state.dragging && !state.animating) {
          next()
        }
      }, option.auto)
    }

    let element = $el
    // 分页器
    if (option.pagination) {
      let indicators = document.createElement('div')
      addClass(indicators, 'swipe-pagination-wrap')
      element.appendChild(indicators)
      for (let i = 0; i < $children.length; i++) {
        let indicator = document.createElement('div')
        addClass(indicator, 'swipe-pagination')
        indicators.appendChild(indicator)
      }
    }
    reInitPages()

    element.addEventListener('touchstart', (event) => {
      if (prevent) {
        event.preventDefault()
      }
      if (state.animating) return
      state.dragging = true
      state.userScrolling = false
      doOnTouchStart(event)
    })

    element.addEventListener('touchmove', (event) => {
      if (!state.dragging) return
      doOnTouchMove(event)
    })

    element.addEventListener('touchend', (event) => {
      if (state.userScrolling) {
        state.dragging = false
        state.dragState = {}
        return
      }
      if (!state.dragging) return
      doOnTouchEnd(event)
      state.dragging = false
    })
  }

  function destroyed () { // 销毁时
    if (state.timer) {
      clearInterval(state.timer)
      state.timer = null
    }
    if (state.reInitTimer) {
      clearTimeout(state.reInitTimer)
      state.reInitTimer = null
    }
  }
  function swipeItemCreated () { // 创建swipeItem
    if (!state.ready) return

    clearTimeout(state.reInitTimer) // 清除 初始化时间器
    state.reInitTimer = setTimeout(() => {
      reInitPages()
    }, 100)
  }

  function swipeItemDestroyed () { // 销毁swipeItem
    if (!state.ready) return

    clearTimeout(state.reInitTimer)
    state.reInitTimer = setTimeout(() => {
      reInitPages()
    }, 100)
  }

  function translate (element, offset, speed, callback) { // 动画转变
    if (speed) {
      state.animating = true
      element.style.webkitTransition = '-webkit-transform ' + speed + 'ms ease-in-out'
      setTimeout(() => {
        element.style.webkitTransform = `translate3d(${offset}px, 0, 0)`
      }, 50)

      var called = false

      var transitionEndCallback = () => {
        if (called) return
        called = true
        state.animating = false
        element.style.webkitTransition = ''
        element.style.webkitTransform = ''
        if (callback) {
          callback.apply(this, arguments)
        }
      }

      once(element, 'webkitTransitionEnd', transitionEndCallback)
      setTimeout(transitionEndCallback, speed + 100) // webkitTransitionEnd maybe not fire on lower version android.
    } else {
      element.style.webkitTransition = ''
      element.style.webkitTransform = `translate3d(${offset}px, 0, 0)`
    }
  }

  function reInitPages () { // 初始化页面
    var children = $children // 获取所有子组件，即所有轮播图
    state.noDrag = children.length === 1 && option.noDragWhenSingle // 当子组件只有一个时不需要拖拽

    var pages = [] // 所有子组件的根 DOM 元素
    state.index = 0 // 当前页

    Array.prototype.forEach.call(children, function (child, index) {
      pages.push(child) // 子组件的根 DOM 元素

      removeClass(child, 'active')

      if (index === 0) { // 第一个子组件默认选中状态
        addClass(child, 'active')
        addClass(document.getElementsByClassName('swipe-pagination')[0], 'active')
      }
    })

    state.pages = pages
  }

  function doAnimate (towards, options) { // 执行动画
    if ($children.length === 0) return
    if (!options && $children.length < 2) return

    var prevPage, nextPage, currentPage, pageWidth, offsetLeft // 上一页 下一页 当前页 页宽 左偏移
    var speed = option.speed || 300
    var index = state.index
    var pages = state.pages
    var pageCount = pages.length

    if (!options) {
      pageWidth = $el.clientWidth
      currentPage = pages[index]
      prevPage = pages[index - 1]
      nextPage = pages[index + 1]
      if (option.loop && pages.length > 1) {
        if (!prevPage) {
          prevPage = pages[pages.length - 1]
        }
        if (!nextPage) {
          nextPage = pages[0]
        }
      }
      if (prevPage) {
        prevPage.style.display = 'block'
        translate(prevPage, -pageWidth)
      }
      if (nextPage) {
        nextPage.style.display = 'block'
        translate(nextPage, pageWidth)
      }
    } else {
      prevPage = options.prevPage
      currentPage = options.currentPage
      nextPage = options.nextPage
      pageWidth = options.pageWidth
      offsetLeft = options.offsetLeft
    }

    var newIndex

    var oldPage = $children[index]

    if (towards === 'prev') {
      if (index > 0) {
        newIndex = index - 1
      }
      if (option.loop && index === 0) {
        newIndex = pageCount - 1
      }
    } else if (towards === 'next') {
      if (index < pageCount - 1) {
        newIndex = index + 1
      }
      if (option.loop && index === pageCount - 1) {
        newIndex = 0
      }
    }
    var callback = () => {
      if (newIndex !== undefined) {
        var newPage = $children[newIndex]
        removeClass(oldPage, 'active')
        addClass(newPage, 'active')
        removeClass(document.querySelector('.swipe-pagination.active'), 'active')
        addClass(document.getElementsByClassName('swipe-pagination')[newIndex], 'active')
        state.index = newIndex
      }

      if (prevPage) {
        prevPage.style.display = ''
      }

      if (nextPage) {
        nextPage.style.display = ''
      }
    }

    setTimeout(() => {
      if (towards === 'next') {
        translate(currentPage, -pageWidth, speed, callback)
        if (nextPage) {
          translate(nextPage, 0, speed)
        }
      } else if (towards === 'prev') {
        translate(currentPage, pageWidth, speed, callback)
        if (prevPage) {
          translate(prevPage, 0, speed)
        }
      } else {
        translate(currentPage, 0, speed, callback)
        if (typeof offsetLeft !== 'undefined') {
          if (prevPage && offsetLeft > 0) {
            translate(prevPage, pageWidth * -1, speed)
          }
          if (nextPage && offsetLeft < 0) {
            translate(nextPage, pageWidth, speed)
          }
        } else {
          if (prevPage) {
            translate(prevPage, pageWidth * -1, speed)
          }
          if (nextPage) {
            translate(nextPage, pageWidth, speed)
          }
        }
      }
    }, 10)
  }

  function next () { // 下一页
    doAnimate('next')
  }

  function prev () { // 上一页
    doAnimate('prev')
  }

  function doOnTouchStart (event) { // 触屏开始
    if (state.noDrag) return

    var element = $el
    var dragState = state.dragState // 拖动状态
    var touch = event.touches[0] // 选取一个触点

    dragState.startTime = new Date()
    dragState.startLeft = touch.pageX
    dragState.startTop = touch.pageY
    dragState.startTopAbsolute = touch.clientY
    dragState.pageWidth = element.offsetWidth
    dragState.pageHeight = element.offsetHeight

    var prevPage = $children[state.index - 1]
    var dragPage = $children[state.index]
    var nextPage = $children[state.index + 1]

    if (option.loop && state.pages.length > 1) {
      if (!prevPage) {
        prevPage = $children[$children.length - 1]
      }
      if (!nextPage) {
        nextPage = $children[0]
      }
    }

    dragState.prevPage = prevPage || null
    dragState.dragPage = dragPage || null
    dragState.nextPage = nextPage || null

    if (dragState.prevPage) {
      dragState.prevPage.style.display = 'block'
    }

    if (dragState.nextPage) {
      dragState.nextPage.style.display = 'block'
    }
  }

  function doOnTouchMove (event) { // 触屏移动
    if (state.noDrag) return

    var dragState = state.dragState
    var touch = event.touches[0]

    dragState.currentLeft = touch.pageX
    dragState.currentTop = touch.pageY
    dragState.currentTopAbsolute = touch.clientY

    var offsetLeft = dragState.currentLeft - dragState.startLeft
    var offsetTop = dragState.currentTopAbsolute - dragState.startTopAbsolute

    var distanceX = Math.abs(offsetLeft)
    var distanceY = Math.abs(offsetTop)
    if (distanceX < 5 || (distanceX >= 5 && distanceY >= 1.73 * distanceX)) {
      state.userScrolling = true
      return
    } else {
      state.userScrolling = false
      event.preventDefault()
    }
    offsetLeft = Math.min(Math.max(-dragState.pageWidth + 1, offsetLeft), dragState.pageWidth - 1)

    var towards = offsetLeft < 0 ? 'next' : 'prev'

    if (dragState.prevPage && towards === 'prev') {
      translate(dragState.prevPage, offsetLeft - dragState.pageWidth)
    }
    translate(dragState.dragPage, offsetLeft)
    if (dragState.nextPage && towards === 'next') {
      translate(dragState.nextPage, offsetLeft + dragState.pageWidth)
    }
  }

  function doOnTouchEnd () { // 触屏结束
    if (state.noDrag) return

    var dragState = state.dragState

    var dragDuration = new Date() - dragState.startTime
    var towards = null

    var offsetLeft = dragState.currentLeft - dragState.startLeft
    var offsetTop = dragState.currentTop - dragState.startTop
    var pageWidth = dragState.pageWidth
    var index = state.index
    var pageCount = state.pages.length

    if (dragDuration < 300) {
      let fireTap = Math.abs(offsetLeft) < 5 && Math.abs(offsetTop) < 5
      if (isNaN(offsetLeft) || isNaN(offsetTop)) {
        fireTap = true
      }
      if (fireTap) {
        $children[state.index].click() // tap
      }
    }

    if (dragDuration < 300 && dragState.currentLeft === undefined) return

    if (dragDuration < 300 || Math.abs(offsetLeft) > pageWidth / 2) {
      towards = offsetLeft < 0 ? 'next' : 'prev'
    }

    if (!option.loop) {
      if ((index === 0 && towards === 'prev') || (index === pageCount - 1 && towards === 'next')) {
        towards = null
      }
    }

    if ($children.length < 2) {
      towards = null
    }

    doAnimate(towards, {
      offsetLeft: offsetLeft,
      pageWidth: dragState.pageWidth,
      prevPage: dragState.prevPage,
      currentPage: dragState.dragPage,
      nextPage: dragState.nextPage
    })

    state.dragState = {}
  }
  return swipe
}));
