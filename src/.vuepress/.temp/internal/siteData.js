export const siteData = JSON.parse("{\"base\":\"/\",\"lang\":\"zh-CN\",\"title\":\"还不知道叫什么名字\",\"description\":\"还不知道叫什么名字的博客\",\"head\":[[\"meta\",{\"name\":\"referrer\",\"content\":\"no-referrer\"}]],\"locales\":{}}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateSiteData) {
    __VUE_HMR_RUNTIME__.updateSiteData(siteData)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ siteData }) => {
    __VUE_HMR_RUNTIME__.updateSiteData(siteData)
  })
}
