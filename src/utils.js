module.exports = {
  /**
   * 根据给定图片查找屏幕上的点
   * @param {string} res 文件夹中需要匹配的图片文件名称
   * @param {number} threshold 匹配度
   * @return {Object} 找到的点坐标对象
   */
  findImageByName(name, threshold) {
    try {
      const context = require.context('./res', false, /\.png$/);
      const imageUrl = context(`./${name}`);
      const templ = images.read(imageUrl);
      if (!templ) {
        throw new Error();
      }
      const capImage = captureScreen();
      const pos = images.findImage(capImage, templ, {
        threshold: threshold || 0.9,
      });
      return pos;
    } catch (error) {
      throw new Error('图片缺失：', files.cwd(), name);
    }
  },
  /**
   * 找到指定属性的祖先节点
   * @param {Object} obj 给定的 UiObject
   * @param {Object} attr 需要查找的存在特定属性的对象
   * @return {Object} 找到的祖先节点 UiObject
   */
  findParentByAttr(obj, attr) {
    const p = obj.parent();
    if (!p) {
      return null;
    }
    const keys = Object.keys(attr);
    let diffFlag = false;
    keys.forEach((key) => {
      if (attr[key] !== p[key]()) {
        diffFlag = true;
      }
    });
    if (diffFlag) {
      return this.findParentByAttr(p, attr);
    }
    return p;
  },
  /**
   * 递归找图并点击消除直至找不到图为止
   * @param {string} name 需要找得图片名称
   * @param {Object} param1 找图操作选项
   */
  findImageAndClick(name, {
    x = 0, y = 0, threshold = 0.8, interval = 0,
  }) {
    const pos = this.findImageByName(name);
    if (!pos) {
      return;
    }
    click(pos.x + x, pos.y + y);
    // 点了之后需要缓一缓，待红点消失
    sleep(interval);
    this.findImageAndClick(name, {
      x,
      y,
      threshold,
      interval,
    });
  },
};
