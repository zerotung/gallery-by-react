require('normalize.css/normalize.css');
require('styles/App.scss');

import React from 'react';
import ReactDOM from 'react-dom';

// 获取图片相关的数据
let imageDatas = require('../data/imageDatas.json');

// 利用自执行函数，将图片名信息转换为图片URL路径信息
imageDatas = (function genImageURL(imageDatasArr) {

	for (let i = 0, j = imageDatasArr.length; i < j; i++) {
		let singleImageData = imageDatasArr[i];

		// webpack 打包信息中，将图片文件打包成一个URL信息
		singleImageData.imageURL = require('../images/' + singleImageData.fileName);

		imageDatasArr[i] = singleImageData;
	}

	return imageDatasArr;
})(imageDatas);

/**
 * 生成范围内的随机整数
 * @param  {int} low  最小值
 * @param  {int} high 最大值
 * @return {int}      生成的随机整数
 */
function getRangeRandom(low, high) {
	return Math.ceil((Math.random() * (high - low) + low))
}

/**
 * 获取 0~30° 之间的一个任意的正负值
 * @return {int} 返回的角度值
 */
function get30DegRandom() {

	// 通过产生一个[0,1)的数与0.5比较大小，得到一个50%概率将随机的30度取负数
	return (Math.random() > 0.5 ? '' : '-') + Math.ceil(Math.random() * 30);
}

class ImageFigure extends React.Component {

	/**
	 * imgFigure 的点击处理函数
	 */
	handleClick(e) {

		// 根据是否在正中心选择居中或翻转
		if (this.props.arrange.isCenter) {
			this.props.inverse();
		} else {
			this.props.center();
		}

		e.stopPropagation();
		e.preventDefault();
	}

	render() {

		let styleObj = {

		};

		// 如果props属性中指定了这张图片的位置，则使用
		if (this.props.arrange.pos) {
			styleObj = this.props.arrange.pos;
		}

		// 如果图片的旋转角度有值且不为零，添加旋转角度
		if (this.props.arrange.rotate) {

			// 为 transform 添加不同的浏览器前缀
			(['MozTransform', 'MsTransform', 'WebkitTransform', 'transform']).forEach(function (value) {
				styleObj[value] = 'rotate(' + this.props.arrange.rotate + 'deg)';
			}.bind(this));
		}

		if (this.props.isCenter) {

			// 将位于中心的图片增加 z-index 值以防止被其余覆盖
			styleObj.zIndex = 11;
		}

		let imgFigureClassName = 'img-figure';
		// 为处于翻转状态的元素添加 is-inverse 的类名，显示相应的样式
		imgFigureClassName += this.props.arrange.isInverse ? ' is-inverse' : '';

		return (
			<figure className={imgFigureClassName} style={styleObj} onClick={e=>this.handleClick(e)}>
				<img src={this.props.data.imageURL}
				     alt={this.props.data.title}/>
				<figcaption>
					<h2 className="img-title">{this.props.data.title}</h2>
					<div className="img-back" onClick={e=>this.handleClick(e)}>
						<p>{this.props.data.desc}</p>
					</div>
				</figcaption>
			</figure>
		)
	}
}

// 控制组件
class ControllerUnit extends React.Component {

	handleClick(e) {

		// 根据控制单元对于的图片位置决定翻转或居中
		if (this.props.arrange.isCenter) {
			this.props.inverse();
		} else {
			this.props.center();
		}

		e.preventDefault();
		e.stopPropagation();
	}

	render () {

		// 对于居中显示的图片对应的控制单元添加一个 Unicode 符号
		// 在 App.scss 中添加了 font-family 和 .iconfont 的样式
		// 字体文件存放在 /src/fonts/icons 中
		let icon = this.props.arrange.isCenter ?
				<i className="iconfont">&#xe6b2;</i> : <span></span>;

		// 根据是否处于中心或翻转，添加相应的类名
		let controllerUnitClassName = 'controller-unit';
		controllerUnitClassName += this.props.arrange.isCenter ? ' is-center' : '';
		controllerUnitClassName += this.props.arrange.isInverse ? ' is-inverse' : '';

		return (
			<span className={controllerUnitClassName} onClick={(e)=>this.handleClick(e)}>
				{icon}
			</span>
		);
	}
}

class AppComponent extends React.Component {

	Constant = {
		centerPos: {  // 中心位置的坐标
			left: 0,
			top: 0
		},
		hPosRange: {  // 水平方向的取值范围
			leftSecX: [0, 0],
			rightSecX: [0, 0],
			y: [0, 0]
		},
		vPosRange: {  // 垂直方向的取值范围
			x: [0, 0],
			topY: [0, 0]
		}
	}

	/**
	 * 翻转图片
	 * @param  {int} index 被翻转的图片的索引值
	 * @return {Function}  闭包函数，返回一个真正的待被执行的函数
	 */
	inverse(index) {

		return function () {

			let imgsArrangeArr = this.state.imgsArrangeArr;

			// 在闭包中存储了 index 值，可以修改 imgsArrangeArr 中相应索引值元素的 isInverse 属性
			imgsArrangeArr[index].isInverse = !imgsArrangeArr[index].isInverse;

			this.setState({
				imgsArrangeArr: imgsArrangeArr
			});
		}.bind(this);
	}

	/**
	 * 居中图片
	 * @param  {index} centerIndex 将要被居中的图片索引值
	 * @return {Function}          闭包函数，返回对应index需要执行的函数
	 */
	center(centerIndex) {

		return function () {

			// 在闭包中存储了 centerIndex 值，可以对对应索引值的元素进行居中
			this.rearrange(centerIndex);
		}.bind(this);
	}

	constructor(props) {

		super(props);
		this.state = {
			imgsArrangeArr: [
				/*{
					pos: {
						left: '0',
						top: '0'
					},
					rotate: 0， // 旋转角度
					isInverse: false,  // 图片正反页
					isCenter: false
				}*/
			]
		}
	}

	/**
	 * 重新布局所有图片
	 * @param  {int} centerIndex 指定居中排布哪个图片
	 * @return {[type]}             [description]
	 */
	rearrange(centerIndex) {

		// 从此对象的 Constant 中取出在 componentDidMount() 中计算出来的各种值
		var imgsArrangeArr = this.state.imgsArrangeArr,
			Constant = this.Constant,
			centerPos = Constant.centerPos,
			hPosRange = Constant.hPosRange,
			vPosRange = Constant.vPosRange,
			hPosRangeLeftSecX = hPosRange.leftSecX,
			hPosRangeRightSecX = hPosRange.rightSecX,
			hPosRangeY = hPosRange.y,
			vPosRangeTopY = vPosRange.topY,
			vPosRangeX = vPosRange.x,

			// 定义了一个将位于上方显示的数组
			imgsArrangeTopArr = [],
			topImgNum = Math.floor(Math.random() * 2),  //取一个或者不取
			topImgSpliceIndex = 0,

			// 从 imgsArrangeArr 中取出 centerIndex 对应的元素，存入 imgsArrangeCenterArr 中
			// imgsArrangeArr 将会去除被去除的元素，长度将减小 1
			imgsArrangeCenterArr = imgsArrangeArr.splice(centerIndex, 1);

			// 设置居中元素的状态信息
			imgsArrangeCenterArr[0] = {
				pos: centerPos,
				isInverse: false,
				isCenter: true
			};

			// 取出要布局在上侧的图片的状态信息
			// 在剩余的 imgsArrangeArr 中随机生成一个索引值，并取出该元素
			topImgSpliceIndex = Math.ceil(Math.random() * (imgsArrangeArr.length - topImgNum));
			imgsArrangeTopArr = imgsArrangeArr.splice(topImgSpliceIndex, topImgNum);

			// 设置位于上侧元素的状态信息
			imgsArrangeTopArr.forEach(function (value, index) {

				imgsArrangeTopArr[index] = {
					pos: {
						top: getRangeRandom(vPosRangeTopY[0], vPosRangeTopY[1]),
						left: getRangeRandom(vPosRangeX[0], vPosRangeX[1])
					},
					rotate: get30DegRandom(),
					isInverse: false,
					isCenter: false
				};

			});

			// 设置位于两侧元素的状态信息
			for (let i = 0, j = imgsArrangeArr.length, k = j / 2; i< j; i++) {

				let hPosRangeLORX = null;

				// 前半部分布局左边，后半部分布局右边
				if (i < k) {
					hPosRangeLORX = hPosRangeLeftSecX;
				} else {
					hPosRangeLORX = hPosRangeRightSecX;
				}

				imgsArrangeArr[i] = {
					pos: {
						top: getRangeRandom(hPosRangeY[0], hPosRangeY[1]),
						left: getRangeRandom(hPosRangeLORX[0], hPosRangeLORX[1])
					},
					rotate: get30DegRandom(),
					isInverse: false,
					isCenter: false
				}
			}

			// 如果之前取出过位于上侧显示的图片，那么将其组合回数组中
			if (imgsArrangeTopArr && imgsArrangeTopArr[0]) {
				// 组合回的索引为 topImgSpliceIndex ，删除 0 个元素，添加的元素为 imgsArrangeTopArr[0]
				imgsArrangeArr.splice(topImgSpliceIndex, 0, imgsArrangeTopArr[0]);
			}

			// 组合回中心显示的元素 索引为 centerIndex ，删除0个元素，添加元素为 imgsArrangeCenterArr[0]
			imgsArrangeArr.splice(centerIndex, 0, imgsArrangeCenterArr[0]);

			this.setState({
				imgsArrangeArr: imgsArrangeArr
			});
	}

	// 组件加载以后，为每张图片计算其位置的范围
	componentDidMount() {

		// 拿到舞台的大小
		let stageDOM = ReactDOM.findDOMNode(this.refs.stage),
		    stageW = stageDOM.scrollWidth,
		    stageH = stageDOM.scrollHeight,
		    halfStageW = Math.ceil(stageW / 2),
		    halfStageH = Math.ceil(stageH / 2);

		// 拿到一个imgFigure的大小
		let imgFigureDOM = ReactDOM.findDOMNode(this.refs.imgFigure0),
		    imgW = imgFigureDOM.scrollWidth,
		    imgH = imgFigureDOM.scrollHeight,
		    halfImgW = Math.ceil(imgW / 2),
		    halfImgH = Math.ceil(imgH /2);

		this.Constant.centerPos = {
			left: halfStageW - halfImgW,
			top: halfStageH - halfImgH
		}

		// 计算左侧右侧区域图片排布位置的取值范围
		this.Constant.hPosRange.leftSecX[0] = -halfImgW;
		this.Constant.hPosRange.leftSecX[1] = halfStageW - halfImgW * 3;
		this.Constant.hPosRange.rightSecX[0] = halfStageW + halfImgW;
		this.Constant.hPosRange.rightSecX[1] = stageW - halfImgW;
		this.Constant.hPosRange.y[0] = -halfImgH;
		this.Constant.hPosRange.y[1] = stageH - halfImgH;

		// 计算上侧区域图片排布位置的取值范围
		this.Constant.vPosRange.topY[0] = -halfImgH;
		this.Constant.vPosRange.topY[1] = halfStageH - halfImgH * 3;
		this.Constant.vPosRange.x[0] = halfStageW - imgW;
		this.Constant.vPosRange.x[1] = halfStageW;

		this.rearrange(0);
	}

	render() {

		let controllerUnits = [],
			imgFigures = [];

		imageDatas.forEach(function(value, index) {

			// 如果未设置则初始化图片状态信息
			if (!this.state.imgsArrangeArr[index]) {
				this.state.imgsArrangeArr[index] = {
					pos: {
						left: 0,
						top: 0
					},
					rotate: 0,
					isInverse: false,
					isCenter: false
				}
			}

			imgFigures.push(<ImageFigure data={value} ref={'imgFigure' + index} key={index}
					arrange={this.state.imgsArrangeArr[index]} inverse={this.inverse(index)}
					center={this.center(index)}/>);

			controllerUnits.push(<ControllerUnit arrange={this.state.imgsArrangeArr[index]}
					key={index} inverse={this.inverse(index)} center={this.center(index)}/>);
		}.bind(this));

		return (
			<section className="stage" ref="stage">
				<section className="img-sec">
					{imgFigures}
				</section>
				<nav className="controller-nav">
					{controllerUnits}
				</nav>
			</section>
		);
	}
}

AppComponent.defaultProps = {
};

export default AppComponent;
