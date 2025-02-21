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
import { hot } from 'react-hot-loader'
import fetch from '../utils/fetch'
import ResultsExportComponent from './presentation'
import { exportResult, exportResultSet } from '../utils/export'
import { getResultSetCql } from '../utils/cql'
import saveFile from '../utils/save-file'
import withListenTo, { WithBackboneProps } from '../backbone-container'

// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'cont... Remove this comment to see the full error message
import contentDisposition from 'content-disposition'

type ExportFormat = {
  id: string
  displayName: string
}

type Result = {
  id: string
  source: string
  attributes: string[]
}

type Props = {
  results: Result[]
  isZipped?: boolean
} & WithBackboneProps

type State = {
  downloadDisabled: boolean
  selectedFormat: string
  exportFormats: ExportFormat[]
}

class ResultsExport extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      selectedFormat: 'Binary Resource',
      exportFormats: [],
      downloadDisabled: true,
    }
  }

  componentDidUpdate(_prevProps: Props) {
    if (
      _prevProps.results !== this.props.results ||
      _prevProps.isZipped !== this.props.isZipped
    ) {
      this.fetchExportOptions()
      this.setState({
        selectedFormat: 'Binary Resource',
        downloadDisabled: true,
      })
    }
  }

  getTransformerType = () => {
    return !this.props.isZipped && this.props.results.length > 1
      ? 'query'
      : 'metacard'
  }

  componentDidMount() {
    this.fetchExportOptions()
  }

  fetchExportOptions = () => {
    fetch(`./internal/transformers/${this.getTransformerType()}`)
      .then((response) => response.json())
      .then((exportFormats: ExportFormat[]) => {
        return exportFormats.sort(
          (format1: ExportFormat, format2: ExportFormat) => {
            if (format1.displayName > format2.displayName) {
              return 1
            }

            if (format1.displayName < format2.displayName) {
              return -1
            }

            return 0
          }
        )
      })
      .then((exportFormats) =>
        this.setState({
          exportFormats: exportFormats,
        })
      )
  }

  getResultSources() {
    return new Set(
      this.props.results
        .map((result: Result) => result.source)
        .map((source: string) => decodeURIComponent(source))
    )
  }

  getSelectedExportFormatId() {
    const selectedFormat = this.state.selectedFormat
    const format = this.state.exportFormats.find(
      (format) => format.displayName === selectedFormat
    )

    if (format !== undefined) {
      return encodeURIComponent(format.id)
    }

    return undefined
  }

  async onDownloadClick() {
    const uriEncodedTransformerId = this.getSelectedExportFormatId()

    if (uriEncodedTransformerId === undefined) {
      return
    }

    let response = null
    const count = this.props.results.length
    const cql = getResultSetCql(
      this.props.results.map((result: Result) => result.id)
    )
    const srcs = Array.from(this.getResultSources())
    const searches = [
      {
        srcs,
        cql,
        count,
      },
    ]

    if (this.props.isZipped) {
      response = await exportResultSet('zipCompression', {
        searches,
        count,
        sorts: [],
        args: {
          transformerId: uriEncodedTransformerId,
        },
      })
    } else if (this.props.results.length > 1) {
      response = await exportResultSet(uriEncodedTransformerId, {
        searches,
        count,
        sorts: [],
      })
    } else {
      const result = this.props.results[0]

      response = await exportResult(
        result.source,
        result.id,
        uriEncodedTransformerId,
        result.attributes.toString()
      )
    }

    if (response.status === 200) {
      const filename = contentDisposition.parse(
        response.headers.get('content-disposition')
      ).parameters.filename
      const contentType = response.headers.get('content-type')
      const data = await response.blob()

      saveFile(filename, 'data:' + contentType, data)
    }
  }
  handleExportOptionChange(name: string) {
    this.setState({
      selectedFormat: name,
      downloadDisabled: false,
    })
  }
  render() {
    return (
      <ResultsExportComponent
        selectedFormat={this.state.selectedFormat}
        exportFormats={this.state.exportFormats}
        downloadDisabled={this.state.downloadDisabled}
        onDownloadClick={this.onDownloadClick.bind(this)}
        handleExportOptionChange={this.handleExportOptionChange.bind(this)}
      />
    )
  }
}

export default hot(module)(withListenTo(ResultsExport))
