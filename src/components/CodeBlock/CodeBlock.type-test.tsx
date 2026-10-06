import { createRef } from 'react'
import { CodeBlock } from './index'
import type { CodeBlockCopyConfig, CodeBlockProps } from './index'

const copy: CodeBlockCopyConfig = { label: 'Copy', copiedLabel: 'Copied', errorLabel: 'Failed' }
const props: CodeBlockProps = { code: 'raw', title: 'Source', language: 'TS', wrap: true, copy }
const valid = <CodeBlock {...props} ref={createRef<HTMLDivElement>()} aria-label="Code" />
// @ts-expect-error raw string is required
const missing = <CodeBlock />
// @ts-expect-error objects are serialized by business
const object = <CodeBlock code={{ result: true }} />
// @ts-expect-error arbitrary children are not supported
const children = <CodeBlock code="raw">Text</CodeBlock>
// @ts-expect-error all localized copy fields are required
const incomplete = <CodeBlock code="raw" copy={{ label: 'Copy' }} />
// @ts-expect-error no HTML injection interface
const html = <CodeBlock code="raw" dangerouslySetInnerHTML={{ __html: 'raw' }} />
void [valid, missing, object, children, incomplete, html]
