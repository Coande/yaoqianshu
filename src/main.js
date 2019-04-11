const config = require('./config.js');
const utils = require('./utils.js');
const logger = require('./logger.js');

const mLogger = logger.getInstance();
const storage = storages.create('com.e12e.liaotianbao');
const capImagePath = `${config.appDirectory}/screenshots.png`;
let nothingCount = 0;
/**
 * 递归查找可操作好友并操作
 */
function scrollDownToFind() {
  mLogger.log('尝试查找去Ta家按钮');
  if (text('去 Ta 家').exists()) {
    nothingCount = 0;
    mLogger.log('找到了去Ta家按钮');
    const found = text('去 Ta 家').findOnce();
    found.click();
    mLogger.log('点击了去Ta家');
    // 点击后可能不能马上反应过来，还留在当前页面，导致waitFor()立马执行了
    sleep(500);
    textContains('收获倒计时').waitFor();
    // 红点需要渲染时间
    sleep(1000);
    utils.findImageAndClick('redpoint.png', {
      x: -10,
      y: 10,
      threshold: 0.8,
      interval: 0,
    });
    if (back()) {
      mLogger.log('按返回键返回');
    } else {
      mLogger.log('尝试查找返回按钮');
      const backPos = utils.findImageByName('back.png');
      if (!backPos) {
        mLogger.log('找不到返回按钮');
        throw new Error('找不到返回按钮，可能返回按钮被遮挡');
      }
      click(backPos.x + 20, backPos.y + 20);
      mLogger.log('点击了返回按钮');
    }
    // 返回之后需要缓一缓
    sleep(500);
  } else {
    mLogger.log('找不到去Ta家按钮');
    mLogger.log('尝试查找邀请按钮');
    if (utils.findImageByName('invite.png')) {
      mLogger.log('找到了邀请按钮，即到底了');
      return;
    } if (++nothingCount === 20) {
      mLogger.log('列表滚动20次没有找到可操作的朋友，判定为滚动到底部了');
      return;
    }
    mLogger.log('找不到邀请按钮，向下滚动');
    textMatches(/LV \d* 经验值 \d*/).waitFor();

    const scrollableObj = utils.findParentByAttr(
      textMatches(/LV \d* 经验值 \d*/).findOnce(),
      {
        scrollable: true,
      },
    );
    if (!scrollableObj) {
      throw new Error('找不到可滚动组件');
    }
    scrollableObj.scrollDown();
    // 滑动后需要等待稳定
    sleep(500);
  }
  scrollDownToFind();
}


try {
  const logPath = `${config.appDirectory}/yaoqianshu.log`;
  files.remove(logPath);
  console.setGlobalLogConfig({
    file: logPath,
  });

  if (!storage.contains('uploadWhenError')) {
    const uploadWhenError = confirm(
      '是否上报错误信息',
      '上报错误信息可以更好的适配你的手机，出错时是否上报错误信息？',
    );

    storage.put('uploadWhenError', uploadWhenError);
  }

  const canStart = confirm(
    '即将开始',
    '需要为本应用开启无障碍服务来模拟操作，需要截图权限来进行识图找按'
      + '钮，请放行。要开始吗？\n\nauthor: Coande\nblog: e12e.com',
  );

  if (!canStart) {
    exit();
  }

  auto.waitFor();
  if (!requestScreenCapture()) {
    alert('需要截图权限', '需要截图权限来进行识图');
    toastLog('没有获取到截图权限，脚本终止');
    exit();
  }

  toastLog('开始了，请放下手机等待操作结束');
  // 需要root，避免使用root
  // shell('am force-stop com.bullet.messenger', true);
  const startTime = new Date().getTime();
  mLogger.log('打开聊天宝');
  launchApp('聊天宝');
  // 4.1.1a版本的Auto.js有bug，打包后非当前app中alert或confrim并不会弹窗并且一直处于阻塞状态
  // alert('请确保在聊天宝主界面');
  waitForActivity('com.smartisan.flashim.main.activity.MainActivity');
  mLogger.log('界面加载完毕');
  while (!click('领钱'));
  mLogger.log('点击了零钱');
  textContains('我的金币').waitFor();
  mLogger.log('界面加载完毕');
  // 等待一下，可能界面没渲染完毕
  sleep(500);
  const scrollableObj = utils.findParentByAttr(
    textContains('我的金币').findOnce(),
    {
      scrollable: true,
    },
  );
  if (!scrollableObj) {
    throw new Error('找不到可滚动组件');
  }
  swipe(100, 1000, 100, 0, 10);
  sleep(500);

  const treePos = utils.findImageByName('yaoqianshu.png', 0.5);
  if (!treePos) {
    throw new Error('找不到摇钱树入口');
  }
  click(treePos.x, treePos.y);
  mLogger.log('点击了摇钱树入口', treePos);
  textContains('收获倒计时').waitFor();

  // 红点需要渲染时间
  sleep(1000);
  utils.findImageAndClick('redpoint.png', {
    x: -10,
    y: 10,
    threshold: 0.8,
    interval: 0,
  });
  const friendPos = utils.findImageByName('friend.png');
  if (!friendPos) {
    throw new Error('找不到朋友按钮');
  }
  click(friendPos.x + 20, friendPos.y + 20);
  textMatches(/LV \d* 经验值 \d*/).waitFor();
  scrollDownToFind();
  const endTime = new Date().getTime();
  const useTimeSec = (endTime - startTime) / 1000;
  toastLog(`正常结束，为你节约${useTimeSec}s`);
  // 退出到聊天宝
  back();
  sleep(500);
  // 退出聊天宝
  back();
  // alert('正常结束', '为你节约' + useTimeSec + 's');
} catch (error) {
  toastLog(`异常终止：${error}`);
  // alert('异常终止', error);
  try {
    if (storage.get('uploadWhenError')) {
      // 尽管已经同意过，也需要先申请权限
      if (!requestScreenCapture()) {
        exit();
      }
      captureScreen(capImagePath);
      const logId = logger.postLog(mLogger.getLog().log).body.json().objectId;
      mLogger.log('logId=', logId);
      const fileId = logger.postScreenCapture().body.json().objectId;
      mLogger.log('fileId=', fileId);
      const res = logger.updateScriptLog(logId, fileId);
      mLogger.log('反馈完毕', res.body.string());
      files.remove(capImagePath);
    }
  } catch (error2) {
    mLogger.log('上报错误时出错了：', error2);
  }
}
