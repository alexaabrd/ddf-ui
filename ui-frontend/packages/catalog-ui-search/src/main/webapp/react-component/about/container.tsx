/**
 * Copyright (c) Codice Foundation
 *
 * This is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser
 * General Public License as published by the Free Software Foundation, either version 3 of the
 * License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details. A copy of the GNU Lesser General Public License
 * is distributed along with this program and can be found at
 * <http://www.gnu.org/licenses/lgpl.html>.
 *
 **/
import * as React from 'react'
import About from './presentation'
import properties from '../../js/properties'
import moment from 'moment'
class AboutContainer extends React.Component {
  constructor(props: any) {
    super(props)
  }
  render() {
    return (
      <About
        date={moment(properties.commitDate).format('MMMM Do YYYY')}
        branding={(properties as any).customBranding}
        isDirty={properties.isDirty}
        commitHash={properties.commitHash}
        commitDate={properties.commitDate}
        product={(properties as any).product}
        version={(properties as any).version}
      />
    )
  }
}
export default AboutContainer
