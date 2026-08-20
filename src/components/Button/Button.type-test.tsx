import { createRef } from 'react'
import { Button, LinkButton } from '../../index'
import type {
  ButtonSize,
  ButtonVariant,
  LinkButtonProps,
} from '../../index'

const buttonRef = createRef<HTMLButtonElement>()
const anchorRef = createRef<HTMLAnchorElement>()

const validVariants: ButtonVariant[] = ['primary', 'secondary', 'danger']
const validSizes: ButtonSize[] = ['sm', 'md', 'lg']

const validButton = (
  <Button
    type="submit"
    name="action"
    variant="primary"
    size="lg"
    ref={buttonRef}
  >
    提交
  </Button>
)

const validLinkButton = (
  <LinkButton
    href="/docs"
    target="_blank"
    disabled
    variant="danger"
    size="sm"
    ref={anchorRef}
  >
    文档
  </LinkButton>
)

// @ts-expect-error Button 不接收只属于链接元素的 href
const buttonWithHref = <Button href="/docs">文档</Button>

// @ts-expect-error LinkButton 的 href 是必填属性
const linkButtonWithoutHref = <LinkButton>文档</LinkButton>

// @ts-expect-error Button 的 ref 必须指向 HTMLButtonElement
const buttonWithAnchorRef = <Button ref={anchorRef}>保存</Button>

// @ts-expect-error LinkButton 的 ref 必须指向 HTMLAnchorElement
const linkButtonWithButtonRef = <LinkButton href="/docs" ref={buttonRef}>文档</LinkButton>

// @ts-expect-error LinkButton 的禁用语义只由 disabled 控制
const linkButtonPropsWithControlledAria = { href: '/docs', children: '文档', 'aria-disabled': 'true' } satisfies LinkButtonProps

// @ts-expect-error LinkButton 始终保持链接语义，不允许覆盖 role
const linkButtonWithOverriddenRole = <LinkButton href="/docs" role="button">文档</LinkButton>

// @ts-expect-error Button 必须拥有可渲染的 children
const buttonWithoutChildren = <Button />

// @ts-expect-error warning 不属于约定的 Button variant
const buttonWithInvalidVariant = <Button variant="warning">警告</Button>

// @ts-expect-error xl 不属于约定的 Button size
const linkButtonWithInvalidSize = <LinkButton href="/docs" size="xl">文档</LinkButton>

void [
  validVariants,
  validSizes,
  validButton,
  validLinkButton,
  buttonWithHref,
  linkButtonWithoutHref,
  buttonWithAnchorRef,
  linkButtonWithButtonRef,
  linkButtonPropsWithControlledAria,
  linkButtonWithOverriddenRole,
  buttonWithoutChildren,
  buttonWithInvalidVariant,
  linkButtonWithInvalidSize,
]
