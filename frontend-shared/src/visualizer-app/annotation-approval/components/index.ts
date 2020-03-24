import {useState} from 'react';
import h from '@macrostrat/hyper';
import {useAnnotationApproved} from '../provider'
import {ApprovalControls} from './controls'
import {SimpleAnnotation, AnnotationProps} from '~/image-overlay/annotation'

interface ApprovableAnnotationProps extends AnnotationProps {
  obj: ApprovableAnnotation
}

const ApprovableAnnotation = (props: ApprovableAnnotationProps)=>{
  const [isHovered, setHovered] = useState(false)
  let alpha = 0.2
  const approved = useAnnotationApproved(props.obj)
  if (approved?.classification != null && approved.proposal != null) {
    alpha = 0.8
  }

  return h(SimpleAnnotation, {
    alpha,
    onMouseEnter: ()=>setHovered(true),
    onMouseLeave: ()=>setHovered(false),
    ...props
  }, [
    h.if(isHovered)(ApprovalControls, {annotation: props.obj})
  ])
}

export {ApprovableAnnotation};
