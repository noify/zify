# zify

代码练习

## MVVM框架

如何实现简单的MVVM框架

### 实现原理

#### 虚拟DOM

以下代码创建了一个虚拟DOM并插入网页中。

```js
var fragment = document.createDocumentFragment();
var input = document.createElement('input');
input.setAttribute('type', 'text');
input.value = 'hello';
fragment.appendChild(input);
document.body.appendChild(fragment);
```

代码执行完毕后，你会发现网页上出现了一个value为 hello 的input。当你想要改变input的内容，只需要这样做：

```js
input.value = 'hello World !';
```

此时网页上的input也会变成 hello World !，这就是虚拟DOM的优势之一。

#### Object.defineProperty(object, propertyname, descriptor)

该方法会直接在一个对象上定义一个新的属性，或者是修改已存在的属性。最终这个方法会返回该对象。

```js
var data = { a: 1 }
var val = data['a']
Object.defineProperty(data, 'a', {
	enumerable: true,
	configurable: false,
	get: function() {
		console.log('get', val)
		return val;
	},
	set: function(newVal) {
		console.log('set', newVal)
		val = newVal
	}
});
```

以上代码重写了data.a的get和set属性，起到了对属性的劫持作用，我们获取data.a或者给其赋值都会在控制打印出其值。

### 实现思路

1. observe 数据监听函数，对数据对象的所有属性进行监听，若属性发生变动便通知相应的 Watcher

2. compile 解析函数，将真实DOM解析成虚拟DOM，处理相应的指令，将模板替换成数据，绑定相应的更新函数，并提供给 Watcher 可更新视图的函数

3. Watcher 观察者，接收 observe 的属性变动的通知，然后使用 compile 提供的函数变更视图

4. 入口函数

实现代码[点击此处](src/vueify.js)


## swipe

轮播图组件

### 实现思路

该组件HTML如下所示

```html
<div class="swipe">
	<div class="swipe-wrap">
		<div class="swiper-slide">swiper 1</div>
		<div class="swiper-slide">swiper 2</div>
		<div class="swiper-slide">swiper 3</div>
	</div>
</div>
```

1. 初始化样式

	设置样式：wrap和swipe都设置为`overflow: hidden;`，相对定位； slide设置为左浮动，相对定位。

	以swipe宽度为准，设置每个slide为一样的宽度，其wrap的宽度为slide个数 * slide宽度。

	如果只有2个slide并且还要实现loop效果则需要克隆该2个slide并放置在相反的收尾。

	根据每个slide的位置来设置他们的偏移量left(left = index * -width)，已达到每个slide都叠加在swipe可视范围内的效果

	根据初始slide来设置每个slide的translate。初始slide为`transform: translate(0px, 0px) translateZ(0px);`

	前一个slide为`transform: translate(-width, 0px) translateZ(0px);`

	下一个slide及其他slide为`transform: translate(+width, 0px) translateZ(0px);`

2. translate函数
	
	轮播图的自动动画效果是为该函数完成。为slide添加样式`transition-duration: 400ms; transform: translate(0px, 0px) translateZ(0px);`，以达到动画的效果。
	
	`transition-duration`设置动画持续时间

	`translate(0px, 0px)`设置动画，每次动画偏移量为slide宽度的倍数

	`translateZ(0px)`是为了启用浏览器的3d加速效果。

3. slide函数

	swipe的动画效果有两种分别是向后和向前。

	每次轮播动画至少需要3个slide(下一个slide，及其前后slide)来完成，3个slide同时向后或者向前translate，以达到动画效果。

4. 拖动效果

	touchstart/mousedown 收集记录初始xy坐标

	touchmove/mousemove 记录当前xy坐标，并根据初始xy坐标计算x轴的偏移量，并对当前slide，及其前后slide translate偏移量，达到拖动的效果

	touchend/mouseup 根据已移动过的偏移量才决定是否做轮播动画


5. 自动轮播

	自动轮播效果是由setTimeout(next, delay)来实现的，delay秒后setTimeout触发向前动画，每次完成结束时将再设置一个setTimeout(next, delay)，如此反复...

	不使用 setinterval 的原因： setinterval 不会等代码运行完以及动画效果完成后再重新计时，这样每次自动轮播都会有时间误差

6. 另一种实现方式

	当浏览器不支持transition，亦或者就是想用新的方式。

	就是不再移动slide，而是直接移动wrap的方式。

	slide不再需要设置偏移量left，正常的一字排开，只需要移动wrap就能带动所有slide移动，已达到轮播效果。

	

	
