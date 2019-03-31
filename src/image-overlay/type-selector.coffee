import {Component} from 'react'
import h from 'react-hyperscript'
import classNames from 'classnames'
import styled from '@emotion/styled'
import {Button} from '@blueprintjs/core'
import {Omnibar} from '@blueprintjs/select'
import Fuse from 'fuse.js'
import chroma from 'chroma-js'

class ListItem extends Component
  toggleLock: (event)=>
    {toggleLock} = @props
    toggleLock()
    event.stopPropagation()
  render: ->
    {active, className, onClick, locked, d...} = @props
    locked ?= false
    className = classNames {active}, className
    color = chroma d.color
    l = if active then 0.5 else 0.95
    light = color.set('hsl.l', l)
    _ = if active then 0.95 else 0.5
    dark = color.set('hsl.l', _)
    icon = if locked then 'lock' else 'unlock'

    h 'div.tag-item-container', {
      key: d.id,
      className, onClick
      style: {backgroundColor: light.css(), color: dark.css()}
    }, [
      h 'div.tag-item', {}, d.name
      h Button, {minimal: true, icon, small: true, onClick: @toggleLock}
    ]

class TypeSelector extends Component
  render: ->
    options = {
      shouldSort: true,
      minMatchCharLength: 0,
      keys: ["name", "description"]
    }
    fuse = null
    {tags, lockedTags, toggleLock, onItemSelect, currentTag, rest...} = @props

    h Omnibar, {
      rest...
      onItemSelect
      items: tags
      resetOnSelect: true
      itemListRenderer: (obj)=>
        console.log currentTag
        {filteredItems, activeItem} = obj
        h 'div.item-list', null, filteredItems.map (d)=>
          active = d.tag_id == currentTag
          locked = lockedTags.has(d.tag_id)
          onClick = =>
            onItemSelect(d)
          h ListItem, {
            active,
            onClick,
            toggleLock: toggleLock(d.tag_id),
            locked, d...}

      itemListPredicate: (query, items)->
        return items if query == ""
        if not fuse?
          fuse = new Fuse(items, options)
        fuse.search(query)
    }

export {TypeSelector}
