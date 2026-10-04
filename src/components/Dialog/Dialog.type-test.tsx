import { createRef } from 'react'
import { Dialog } from './index'
import type { DialogProps } from './index'
import type { MatthewThemeConfig } from '../../theme'

const ref = createRef<HTMLDialogElement>()
const props: DialogProps = { open: false, onOpenChange: value => void value, title: <span>Title</span>, closeLabel: 'Close', children: 'Content' }
const valid = <Dialog {...props} ref={ref} title={<strong>Title</strong>} footer={<button>Save</button>} initialFocus={() => ref.current?.querySelector('button') ?? null} />
// @ts-expect-error Controlled state is required.
const uncontrolled = <Dialog title="Title" closeLabel="Close" onOpenChange={() => {}}>Content</Dialog>
// @ts-expect-error No defaultOpen mode.
const defaultOpen = <Dialog {...props} defaultOpen />
// @ts-expect-error Localized close name is required.
const unnamed = <Dialog open title="Title" onOpenChange={() => {}}>Content</Dialog>
// @ts-expect-error Dialog exposes the native dialog element, not a section div.
const invalidRef = <Dialog {...props} ref={createRef<HTMLDivElement>()} />
// @ts-expect-error Callers cannot replace modal semantics.
const invalidRole = <Dialog {...props} role="menu" />
// @ts-expect-error No width Token or positioning switches.
const invalidToken: MatthewThemeConfig = { components: { Dialog: { width: 800 } } }
void [valid, uncontrolled, defaultOpen, unnamed, invalidRef, invalidRole, invalidToken]
