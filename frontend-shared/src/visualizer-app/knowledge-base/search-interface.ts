import h from '@macrostrat/hyper';
import {useState, useEffect} from 'react';
import {
  InputGroup,
  Button,
  ButtonGroup,
  Collapse,
  Card,
  Intent,
  FormGroup,
  ISliderProps
} from '@blueprintjs/core';
import {InlineNavbar} from '~/util'
import {
  NullableSlider
} from '@macrostrat/ui-components'
import {
  useAppState,
  useAppDispatch,
  useTypes,
  SearchBackend,
  ThresholdKey} from './provider'
import {Spec} from 'immutability-helper'

interface ConfidenceSliderProps extends ISliderProps {
  id: ThresholdKey,
  label: string,
  labelInfo?: string
}

const ConfidenceSlider = (props: ConfidenceSliderProps)=>{
  const {id, label, max: _max, labelInfo, ...rest} = props
  const {filterParams} = useAppState()
  const dispatch = useAppDispatch()

  const max = _max ?? 1

  const confProps = {min: 0, max, initialValue: max, stepSize: 0.02, labelStepSize: 0.2, labelPrecision: 1}
  const onRelease = (value: number)=> dispatch({type: 'set-threshold', key: id, value})

  const value = filterParams[id]

  return h(FormGroup, {label, labelInfo, inline: true},
    h(NullableSlider, {...confProps, ...rest, onRelease, value})
  )
}

const SliderPanel = (props)=>{
  return h("div.slider-panel", [
    h(ConfidenceSlider, {
      id: "base_confidence",
      label: "Base confidence"
    }),
    h(ConfidenceSlider, {
      id: "postprocessing_confidence",
      label: "Post confidence"
    }),
    h(ConfidenceSlider, {
      id: "area",
      label: "Area",
      labelInfo: "(px²)",
      min: 30000,
      max: 100000,
      stepSize: 10000,
      labelStepSize: 30000,
      labelRenderer: (v)=>`${v/1000}k`
    })
  ])
}

const TypeSelector = (props)=> {
  const types = useTypes()
  const dispatch = useAppDispatch()
  const {filterParams} = useAppState()
  const filterType = filterParams.type

  const setFilterType = (cls: FeatureType|null)=>()=>{
    if (filterType == cls?.id) return
    dispatch({type: 'set-filter-type', featureType: cls})
  }

  return h("div.type-selector", [
    h("h3", "Extraction type"),
    h("div.filter-types", [
      h(ButtonGroup, [...types, null].map(d => h(Button, {
        intent: filterType == d?.id ? Intent.PRIMARY : null,
        onClick: setFilterType(d)
      }, d?.name ?? "All")))
    ])
  ])
}

const SearchBackendSelector = ()=>{
  const {searchBackend} = useAppState()
  const dispatch = useAppDispatch()

  const propsFor = (backend: SearchBackend)=>({
    intent: searchBackend == backend ? Intent.PRIMARY : null,
    onClick() {
      if (backend == searchBackend) return
      dispatch({type: 'set-search-backend', backend})
    },
    children: backend,
    small: true
  })

  return h(FormGroup, {label: h("h4", "Backend")},
    h(ButtonGroup, [
      h(Button, propsFor(SearchBackend.Anserini)),
      h(Button, propsFor(SearchBackend.ElasticSearch))
    ])
  )
}

const FilterPanel = (props)=> {
  const {filterPanelOpen} = useAppState()
  const dispatch = useAppDispatch()


  const [detailsExpanded, expandDetails] = useState(false)

  return h(Collapse, {isOpen: filterPanelOpen}, [
    h(Card, {elevation: 1, className: 'filter-controls bp3-text'}, [
      h("div.inner", [
        h("div.top-row", [
          h(TypeSelector),
          h("div.right-controls", null,
            h(ButtonGroup, {minimal: true, small: true}, [
              h(Button, {
                onClick() { expandDetails(!detailsExpanded) }
              }, detailsExpanded ? "Hide details" : "Show details"),
              h(Button, {
                icon: "cross",
                intent: Intent.DANGER,
                onClick() {
                  dispatch({type: "toggle-filter-panel", value: false})
                }
              })
            ])
          ),
        ]),
        h(Collapse, {className: "search-details", isOpen: detailsExpanded}, [
          h("div.threshold-controls", [
            h("h4", "Thresholds"),
            h(SliderPanel),
          ]),
          h(SearchBackendSelector)
        ])
      ])
    ])
  ])
}

interface SearchInterfaceProps {}

const Searchbar = (props: SearchInterfaceProps)=>{

  const {filterParams, filterPanelOpen} = useAppState()
  const dispatch = useAppDispatch()

  const [inputValue, setInputValue] = useState<string>("")

  useEffect(()=>{
    setInputValue(filterParams.query)
  }, [filterParams.query])

  const updateFilter = (spec: Spec<FilterParams>)=>{
    dispatch({type: 'update-filter', spec})
  }

  const setFilterPanelOpen = (value: boolean|undefined)=> {
    dispatch({type: "toggle-filter-panel", value})
  }

  const types = useTypes()
  const name = types.find(d => d.id == filterParams.type)?.name ?? "All types"

  const filterButton = h(Button, {
    minimal: true,
    intent: !filterPanelOpen ? Intent.PRIMARY : null,
    icon: "filter",
    large: true,
    onClick(){ setFilterPanelOpen(!filterPanelOpen) }
  }, name)

  const updateQuery = ()=> updateFilter({query: {$set: inputValue}})
  const onChange = event => setInputValue(event.target.value);

  return h('div.search-bar-contents', [
    h(InputGroup, {
      className: 'main-search',
      large: true,
      value: inputValue,
      leftIcon: 'search',
      placeholder: "Search extractions",
      onChange,
      onKeyPress: (event)=>{
        if (event.key === 'Enter') updateQuery()
      },
      rightElement: h("div.right-buttons", [
        filterButton,
        h(Button, {
          icon: 'arrow-right',
          disabled: inputValue == filterParams.query,
          intent: Intent.SUCCESS,
          onClick(){
            updateQuery()
          }
        })
      ])
    }),
  ]);
}

const SearchInterface = (props)=>{
  return h("div.search-interface", [
    h(InlineNavbar, null, h(Searchbar)),
    h(FilterPanel)
  ])

}


export {SearchInterface}
