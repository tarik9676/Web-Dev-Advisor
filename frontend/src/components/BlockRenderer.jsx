import React from 'react';
import { Type, Heading1, Image, Square, List, DollarSign, Images, Code, Minus, Layout, Quote, Columns, Box, Code2 } from 'lucide-react';
import { useVariableScope } from '../context/BlockVariableContext.jsx';
import { resolvePaddingValue, resolveMarginValue, LEGACY_CONTAINER_PADDING, LEGACY_TEXT_PADDING } from '../lib/blockSpacing.js';
import {
  resolveWidthValue, resolveFontSizeValue, resolveColorValue,
  resolveBorderValue, resolveBorderRadiusValue,
  LEGACY_CONTAINER_WIDTH,
} from '../lib/blockStyles.js';

const ICONS = { Type, Heading1, Image, Square, List, DollarSign, Images, Code, Minus, Layout, Quote, Columns, Box, Code2 };

function Icon({ name, size = 16 }) {
  const Comp = ICONS[name] || Square;
  return <Comp size={size} />;
}

/*
 * Preview-only renderers. All editing happens in the left settings panel
 * (BlockPropertyPanel in BlockEditor), which reads its field definitions from
 * BLOCK_TYPES[type].propertySchema — so adding a block type needs no change here
 * unless it needs a bespoke public layout.
 */

/**
 * Padding is free-form CSS. Text blocks pad vertically only, so their legacy
 * presets map differently from the all-sides presets used by every other type.
 */
function blockPadding(block) {
  return resolvePaddingValue(
    block.padding,
    block.type === 'text' ? LEGACY_TEXT_PADDING : LEGACY_CONTAINER_PADDING
  );
}

function TextBlock({ block }) {
  const padding = blockPadding(block);
  return (
    <div
      className={`block-text align-${block.alignment}${padding ? '' : ' pad-normal'}`}
      // No font-size is declared for .block-text or its children, so an inline
      // size here inherits into the authored <p>/<ul>/etc. content.
      style={{ padding, fontSize: resolveFontSizeValue(block.size) }}
    >
      <div className="block-text-content" dangerouslySetInnerHTML={{ __html: block.content }} />
    </div>
  );
}

function HeadingBlock({ block }) {
  const Tag = block.level || 'h2';
  return (
    <div
      className={`block-heading align-${block.alignment}`}
      style={{ padding: blockPadding(block) }}
    >
      <Tag style={{ fontSize: resolveFontSizeValue(block.size) }}>{block.content}</Tag>
    </div>
  );
}

function ImageBlock({ block }) {
  if (!block.url) return <div className="block-image-empty">No image selected</div>;
  return (
    <div
      className="block-image"
      style={{ width: resolveWidthValue(block.width), padding: blockPadding(block) }}
    >
      <img src={block.url} alt={block.alt || ''} />
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </div>
  );
}

function ButtonBlock({ block }) {
  return (
    <div className={`block-button align-${block.alignment}`} style={{ padding: blockPadding(block) }}>
      <a href={block.url || '/contact'} className={`btn btn-${block.variant || 'primary'} btn-${block.size || 'default'}`}>
        {block.text}
      </a>
    </div>
  );
}

function FeaturesBlock({ block }) {
  const cols = block.columns === 2 ? 'two' : block.columns === 3 ? 'three' : 'one';
  return (
    <div className="block-features" style={{ padding: blockPadding(block) }}>
      {block.title && <h3>{block.title}</h3>}
      <ul className={`features-list cols-${cols}`}>
        {(block.items || []).map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

function PricingBlock({ block }) {
  return (
    <div className="block-pricing" style={{ padding: blockPadding(block) }}>
      {block.title && <h3>{block.title}</h3>}
      <div className="pricing-cards">
        {(block.plans || []).map((plan, i) => (
          <div key={i} className={`pricing-card${plan.popular ? ' popular' : ''}`}>
            {plan.popular && <span className="popular-badge">Most Popular</span>}
            <h4>{plan.name}</h4>
            <div className="price">{plan.price}</div>
            <ul>{(plan.features || []).map((f, j) => <li key={j}>{f}</li>)}</ul>
            <a href="/contact" className="btn btn-primary">Get Started</a>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryBlock({ block }) {
  const images = Array.isArray(block.images) ? block.images : [];
  if (!images.length) return <div className="block-gallery-empty">No images</div>;
  const cols = block.columns === 3 ? 'three' : block.columns === 2 ? 'two' : 'one';
  return (
    <div className={`block-gallery cols-${cols}`} style={{ padding: blockPadding(block) }}>
      {images.map((img, i) => <img key={i} src={img.url || img} alt={img.alt || ''} />)}
    </div>
  );
}

function CodeBlock({ block }) {
  return (
    <div className="block-code" style={{ padding: blockPadding(block) }}>
      <pre><code>{block.code}</code></pre>
    </div>
  );
}

function DividerBlock({ block }) {
  return (
    <hr
      className={`divider-${block.style} spacing-${block.spacing}`}
      style={{ padding: blockPadding(block) }}
    />
  );
}

function SpacerBlock({ block }) {
  return <div style={{ height: block.height, padding: blockPadding(block) }} />;
}

function HtmlBlock({ block }) {
  return <div style={{ padding: blockPadding(block) }} dangerouslySetInnerHTML={{ __html: block.html }} />;
}

function CardBlock({ block }) {
  return (
    <div className="block-card" style={{ padding: blockPadding(block) }}>
      {block.image && <img src={block.image} alt={block.title} />}
      <div className="block-card-body">
        <h4>{block.title}</h4>
        {block.description && <p>{block.description}</p>}
        {block.link && <a href={block.link} className="btn btn-secondary">{block.linkText || 'Learn more'}</a>}
      </div>
    </div>
  );
}

function TestimonialBlock({ block }) {
  return (
    <div className="block-testimonial" style={{ padding: blockPadding(block) }}>
      <Quote size={24} />
      <p>{block.quote}</p>
      <footer>
        <strong>{block.author}</strong>
        {block.role && <span>{block.role}</span>}
      </footer>
    </div>
  );
}

function ContainerBlock({ block, renderChildren }) {
  const children = Array.isArray(block.blocks) ? block.blocks : [];
  const padding = blockPadding(block);
  const isRow = block.direction === 'row';
  const maxWidth = resolveWidthValue(block.maxWidth);
  const background = resolveColorValue(block.background);
  const border = resolveBorderValue(block.border);
  const borderRadius = resolveBorderRadiusValue(block.borderRadius);
  const margin = resolveMarginValue(block.margin);
  const style = {
    // `width` accepts free-form CSS; legacy presets (full/half/...) map on read.
    width: resolveWidthValue(block.width, LEGACY_CONTAINER_WIDTH) || '100%',
    // A full-bleed container must not inherit the 1200px measure, so max-width
    // is opt-in and omitted entirely when unset.
    ...(maxWidth ? { maxWidth } : {}),
    // Margin lives here rather than on the per-block wrapper so that a
    // horizontal `auto` margin can centre this box against its own width.
    ...(margin ? { margin } : {}),
    padding: padding || '16px',
    // `background` rather than `backgroundColor` so gradients also work.
    ...(background ? { background } : {}),
    display: 'flex',
    flexDirection: isRow ? 'row' : 'column',
    gap: '16px',
    // Row children keep their own width as the flex basis and shrink to fit.
    // Wrapping here would push every 100%-wide default child onto its own line.
    flexWrap: isRow ? 'nowrap' : 'nowrap',
    ...(border ? { border } : {}),
    ...(borderRadius ? { borderRadius } : {}),
  };
  const className = `block-container-preview${isRow ? ' is-row' : ''}`;

  // In the editor the parent supplies its own interactive child list so each
  // nested block is selectable; rendering here too would duplicate content.
  if (renderChildren) {
    return (
      <div className={className} style={style}>
        {renderChildren()}
      </div>
    );
  }

  if (!children.length) {
    return (
      <div className={className} style={style}>
        <div className="container-empty">Empty container — add blocks from its settings panel</div>
      </div>
    );
  }
  return (
    <div className={className} style={style}>
      {children.map((child, i) => (
        <BlockRenderer key={`${child.id}-${i}`} block={child} />
      ))}
    </div>
  );
}

const RENDERERS = {
  text: TextBlock,
  heading: HeadingBlock,
  image: ImageBlock,
  button: ButtonBlock,
  features: FeaturesBlock,
  pricing: PricingBlock,
  gallery: GalleryBlock,
  code: CodeBlock,
  divider: DividerBlock,
  spacer: SpacerBlock,
  html: HtmlBlock,
  card: CardBlock,
  testimonial: TestimonialBlock,
  container: ContainerBlock,
};

export default function BlockRenderer({ block, renderChildren }) {
  // Resolve {{entity.field}} tokens against the nearest provided scope. The admin
  // canvas supplies the in-progress record, so the canvas previews the same
  // values the public page will render.
  const scope = useVariableScope();
  const Renderer = RENDERERS[block.type];
  if (!Renderer) return <div>Unknown block: {block.type}</div>;
  const resolved = scope ? scope.resolve(block) : block;
  return <Renderer block={resolved} renderChildren={renderChildren} />;
}

export { Icon };