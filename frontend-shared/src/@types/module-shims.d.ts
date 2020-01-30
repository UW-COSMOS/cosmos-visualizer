
declare module '@macrostrat/ui-components' {
  import '@macrostrat/ui-components'
  import {Component} from 'react'

  export class StatefulComponent<P,S> extends Component<P,S> {
    updateState(v: object): void
  }
}
