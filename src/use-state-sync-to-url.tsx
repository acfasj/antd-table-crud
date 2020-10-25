import React from 'react'
import qs from 'qs'

export function useStateSyncToUrl<T>(state: T, options?: qs.IStringifyOptions) {
  const optionsRef = React.useRef(options)
  React.useEffect(() => {
    const { protocol, host, pathname } = window.location
    const newurl = `${protocol}//${host}${pathname}?${qs.stringify(
      state,
      optionsRef.current
    )}`
    window.history.replaceState(null, '', newurl)
    // state每次变化的时候同步参数到url
  }, [state])
}
