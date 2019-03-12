const config = require('./config.js');

module.exports = {
  /**
   * 带记录的log工具
   * @return 替代console的实例，该实例有log记录
   */
  getInstance() {
    const logInfo = {
      log: '',
      info: '',
      warn: '',
      error: '',
    };
    return {
      log(str) {
        logInfo.log += `${str}\n`;
        console.log(str);
      },
      info(str) {
        logInfo.info += `${str}\n`;
        console.info(str);
      },
      warn(str) {
        logInfo.warn += `${str}\n`;
        console.warn(str);
      },
      error(str) {
        logInfo.error += `${str}\n`;
        console.error(str);
      },
      getLog() {
        return logInfo;
      },
    };
  },
  /**
   * 反馈日志数据
   * @param {string} logString 需要上传的日志数据
   * @return {Object}
   */
  postLog(logString) {
    const url = `${config.baseUrl}/classes/ScriptLog`;
    const deviceInfo = JSON.stringify(device.toString());
    const res = http.postJson(
      url,
      {
        brand: device.brand,
        model: device.model,
        // logInfo: files.read(`${config.appDirectory}/yaoqianshu.log`),
        logInfo: logString,
        deviceInfo: deviceInfo.toString(),
      },
      {
        headers: {
          'X-LC-Id': config.appId,
          'X-LC-Key': config.appKey,
        },
      },
    );
    return res;
  },

  /**
   * 反馈图片数据
   * @return {Object}
   */
  postScreenCapture() {
    /* globals importPackage Packages java RequestBody
     MediaType MultipartBody Request OkHttpClient TimeUnit
     */
    importPackage(Packages.okhttp3);
    importPackage(java.util.concurrent);

    const url = config.baseUrl + '/files/screenCapture.png';

    if (!requestScreenCapture()) {
      alert('需要截图权限', '需要截图权限来进行识图');
      toastLog('没有获取到截图权限，脚本终止');
      exit();
    }
    const capImage = captureScreen();

    const fileBody = RequestBody.create(MediaType.parse('image/png'), images.toBytes(capImage));
    const requestBody = new MultipartBody.Builder()
      .setType(MultipartBody.FORM)
      // 上传到 leancloud 的话参数名必须是 file ，否则 leancloud 报错： File is required .
      .addFormDataPart('file', 'screenCapture.png', fileBody)
      .build();
    const request = new Request.Builder()
      .addHeader('X-LC-Id', config.appId)
      .addHeader('X-LC-Key', config.appKey)
      .url(url)
      .post(requestBody)
      .build();
    const httpBuilder = new OkHttpClient.Builder();
    const okHttpClient = httpBuilder
      // 设置超时
      .connectTimeout(100, TimeUnit.SECONDS)
      .writeTimeout(150, TimeUnit.SECONDS)
      .build();
    const res = okHttpClient.newCall(request).execute();
    return res;
  },

  /**
   * 更新日志数据
   * @param {string} logId 需要更新的日志id
   * @param {string} fileId 需要更新为指定的fileId
   * @return {Object}
   */
  updateScriptLog(logId, fileId) {
    const url = `${config.baseUrl}/classes/ScriptLog/${logId}`;

    const body = JSON.stringify({
      screenshots: {
        id: fileId,
        __type: 'File',
      },
    });

    const res = http.request(url, {
      method: 'PUT',
      headers: {
        'X-LC-Id': config.appId,
        'X-LC-Key': config.appKey,
        // 必须加上contentType，不然leancloud接收不了
        'Content-Type': 'application/json',
      },
      body,
    });
    return res;
  },
};
