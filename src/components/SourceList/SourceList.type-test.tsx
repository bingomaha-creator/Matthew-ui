import { createRef } from 'react'
import { SourceList } from '../../index'
import type { SourceListItem, SourceListProps, MatthewThemeConfig } from '../../index'

const items: readonly SourceListItem[] = [{ id: 'one', title: 'Document', summary: 'Evidence', source: 'Local', href: '/docs', target: '_blank', domId: 'evidence-one' }]
const props: SourceListProps = { items, title: 'Sources', onOpenChange: open => void open }
const valid = <SourceList {...props} ref={createRef<HTMLDivElement>()} aria-label="Sources" />
// @ts-expect-error No children slot.
const children = <SourceList items={items}>Extra</SourceList>
// @ts-expect-error No HTML injection.
const html = <SourceList items={items} dangerouslySetInnerHTML={{ __html: 'Extra' }} />
// @ts-expect-error Titles are plain text.
const title = <SourceList items={items} title={<b>Heading</b>} />
// @ts-expect-error Item titles are plain text.
const item: SourceListItem = { id: 'x', title: <b>Rich</b> }
// @ts-expect-error Target is intentionally restricted.
const target: SourceListItem = { id: 'x', title: 'Plain', target: '_parent' }
// @ts-expect-error SourceList ref is not a list element.
const ref = <SourceList items={items} ref={createRef<HTMLUListElement>()} />
// @ts-expect-error Dimensions are design-unit numbers.
const dimension: MatthewThemeConfig = { components: { SourceList: { itemPaddingBlock: '12px' } } }
// @ts-expect-error No width Token.
const width: MatthewThemeConfig = { components: { SourceList: { width: 480 } } }
void [valid, children, html, title, item, target, ref, dimension, width]
