import {createContext, useContext, ReactNode} from 'react'
import h from 'react-hyperscript'

interface CanvasSizeCtx {
  width: number,
  height: number,
  scaleFactor: number
}

interface ProviderProps extends CanvasSizeCtx {
  children?: ReactNode
}

const CanvasSizeContext = createContext<CanvasSizeCtx|null>(null)

const CanvasSizeProvider = (props: ProviderProps)=>{
  const {children, ...rest} = props
  return h(CanvasSizeContext.Provider, {value: rest}, children)
}

CanvasSizeProvider.defaultProps = {
  scaleFactor: 1
}

const useCanvasSize = ()=>useContext(CanvasSizeContext)!

export {CanvasSizeProvider, CanvasSizeContext, useCanvasSize}
