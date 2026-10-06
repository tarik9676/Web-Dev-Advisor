/**
 * Block type registry for the drag & drop page editor.
 * Each block has: type, label, icon, defaults, and a render function.
 */
export const BLOCK_TYPES = {
  text: {
    type: 'text',
    label: 'Text',
    icon: 'Type',
    defaults: {
      margin: '',
      padding: '8px 0',
      size: '',
      content: '<p>Enter your text here...</p>',
      alignment: 'left',
    },
    propertySchema: {
      margin: { type: 'text', label: 'Margin' },
      padding: { type: 'text', label: 'Padding' },
      size: { type: 'text', label: 'Font Size' },
      content: { type: 'richtext', label: 'Content' },
      alignment: { type: 'segmented', label: 'Alignment', options: [
        { value: 'left', label: 'Left', icon: 'AlignLeft' },
        { value: 'center', label: 'Center', icon: 'AlignCenter' },
        { value: 'right', label: 'Right', icon: 'AlignRight' },
      ] },
    },
  },
  heading: {
    type: 'heading',
    label: 'Heading',
    icon: 'Heading1',
    defaults: {
      margin: '',
      padding: '',
      content: 'Section Title',
      level: 'h2',
      alignment: 'left',
      size: '24px',
    },
    propertySchema: {
      margin: { type: 'text', label: 'Margin' },
      padding: { type: 'text', label: 'Padding' },
      content: { type: 'text', label: 'Heading Text' },
      level: { type: 'select', label: 'Level', options: [{ value: 'h1', label: 'H1' }, { value: 'h2', label: 'H2' }, { value: 'h3', label: 'H3' }, { value: 'h4', label: 'H4' }] },
      alignment: { type: 'segmented', label: 'Alignment', options: [
        { value: 'left', label: 'Left', icon: 'AlignLeft' },
        { value: 'center', label: 'Center', icon: 'AlignCenter' },
        { value: 'right', label: 'Right', icon: 'AlignRight' },
      ] },
      size: { type: 'text', label: 'Font Size' },
    },
  },
  image: {
    type: 'image',
    label: 'Image',
    icon: 'Image',
    defaults: {
      margin: '',
      padding: '',
      url: '',
      alt: '',
      caption: '',
      width: '100%',
      link: '',
    },
    propertySchema: {
      margin: { type: 'text', label: 'Margin' },
      padding: { type: 'text', label: 'Padding' },
      url: { type: 'text', label: 'Image URL' },
      alt: { type: 'text', label: 'Alt Text' },
      caption: { type: 'text', label: 'Caption' },
      width: { type: 'text', label: 'Width' },
      link: { type: 'text', label: 'Link URL (optional)' },
    },
  },
  button: {
    type: 'button',
    label: 'Button',
    icon: 'Square',
    defaults: {
      margin: '',
      padding: '',
      text: 'Get Started',
      url: '/contact',
      variant: 'primary',
      size: 'default',
      alignment: 'left',
    },
    propertySchema: {
      margin: { type: 'text', label: 'Margin' },
      padding: { type: 'text', label: 'Padding' },
      text: { type: 'text', label: 'Button Text' },
      url: { type: 'text', label: 'URL' },
      variant: { type: 'select', label: 'Variant', options: [{ value: 'primary', label: 'Primary' }, { value: 'secondary', label: 'Secondary' }, { value: 'outline', label: 'Outline' }] },
      size: { type: 'text', label: 'Font Size' },
      alignment: { type: 'segmented', label: 'Alignment', options: [
        { value: 'left', label: 'Left', icon: 'AlignLeft' },
        { value: 'center', label: 'Center', icon: 'AlignCenter' },
        { value: 'right', label: 'Right', icon: 'AlignRight' },
      ] },
    },
  },
  features: {
    type: 'features',
    label: 'Feature List',
    icon: 'List',
    defaults: {
      margin: '',
      padding: '',
      title: 'What\'s Included',
      items: ['Feature one', 'Feature two', 'Feature three'],
      columns: 1,
    },
    propertySchema: {
      margin: { type: 'text', label: 'Margin' },
      padding: { type: 'text', label: 'Padding' },
      title: { type: 'text', label: 'Title' },
      items: { type: 'array', label: 'Features', itemDefault: 'New feature' },
      columns: { type: 'select', label: 'Columns', options: [{ value: '1', label: '1 Column' }, { value: '2', label: '2 Columns' }, { value: '3', label: '3 Columns' }] },
    },
  },
  pricing: {
    type: 'pricing',
    label: 'Pricing',
    icon: 'DollarSign',
    defaults: {
      margin: '',
      padding: '',
      title: 'Pricing Plans',
      plans: [
        { name: 'Basic', price: '$99/mo', features: ['Feature 1', 'Feature 2'], popular: false },
        { name: 'Pro', price: '$199/mo', features: ['Feature 1', 'Feature 2', 'Feature 3'], popular: true },
      ],
    },
    propertySchema: {
      margin: { type: 'text', label: 'Margin' },
      padding: { type: 'text', label: 'Padding' },
      title: { type: 'text', label: 'Title' },
      plans: { type: 'array', label: 'Plans', itemDefault: { name: 'Plan', price: '$/mo', features: [], popular: false } },
    },
  },
  gallery: {
    type: 'gallery',
    label: 'Image Gallery',
    icon: 'Images',
    defaults: {
      margin: '',
      padding: '',
      images: [],
      columns: 2,
    },
    propertySchema: {
      margin: { type: 'text', label: 'Margin' },
      padding: { type: 'text', label: 'Padding' },
      images: { type: 'array', label: 'Images', itemDefault: { url: '', alt: '' } },
      columns: { type: 'select', label: 'Columns', options: [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }] },
    },
  },
  code: {
    type: 'code',
    label: 'Code Block',
    icon: 'Code',
    defaults: {
      margin: '',
      padding: '',
      code: '// Your code here',
      language: 'javascript',
    },
    propertySchema: {
      margin: { type: 'text', label: 'Margin' },
      padding: { type: 'text', label: 'Padding' },
      code: { type: 'textarea', label: 'Code', rows: 10 },
      language: { type: 'select', label: 'Language', options: [{ value: 'javascript', label: 'JavaScript' }, { value: 'typescript', label: 'TypeScript' }, { value: 'python', label: 'Python' }, { value: 'php', label: 'PHP' }, { value: 'html', label: 'HTML' }, { value: 'css', label: 'CSS' }, { value: 'json', label: 'JSON' }, { value: 'bash', label: 'Bash' }, { value: 'sql', label: 'SQL' }] },
    },
  },
  divider: {
    type: 'divider',
    label: 'Divider',
    icon: 'Minus',
    defaults: {
      margin: '',
      padding: '',
      style: 'solid',
      spacing: 'medium',
    },
    propertySchema: {
      margin: { type: 'text', label: 'Margin' },
      padding: { type: 'text', label: 'Padding' },
      style: { type: 'select', label: 'Style', options: [{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }, { value: 'double', label: 'Double' }] },
      spacing: { type: 'select', label: 'Spacing', options: [{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }] },
    },
  },
  spacer: {
    type: 'spacer',
    label: 'Spacer',
    icon: 'Square',
    defaults: {
      margin: '',
      padding: '',
      height: 32,
    },
    propertySchema: {
      margin: { type: 'text', label: 'Margin' },
      padding: { type: 'text', label: 'Padding' },
      height: { type: 'number', label: 'Height (px)', min: 8, max: 200, step: 8 },
    },
  },
  html: {
    type: 'html',
    label: 'Custom HTML',
    icon: 'Code2',
    defaults: {
      margin: '',
      padding: '',
      html: '<div>Custom HTML content</div>',
    },
    propertySchema: {
      margin: { type: 'text', label: 'Margin' },
      padding: { type: 'text', label: 'Padding' },
      html: { type: 'textarea', label: 'HTML', rows: 8 },
    },
  },
  card: {
    type: 'card',
    label: 'Card',
    icon: 'Layout',
    defaults: {
      margin: '',
      padding: '',
      title: 'Card Title',
      description: 'Card description text',
      image: '',
      link: '',
      linkText: 'Learn more',
    },
    propertySchema: {
      margin: { type: 'text', label: 'Margin' },
      padding: { type: 'text', label: 'Padding' },
      title: { type: 'text', label: 'Title' },
      description: { type: 'textarea', label: 'Description', rows: 3 },
      image: { type: 'text', label: 'Image URL' },
      link: { type: 'text', label: 'Link URL' },
      linkText: { type: 'text', label: 'Link Text' },
    },
  },
  testimonial: {
    type: 'testimonial',
    label: 'Testimonial',
    icon: 'Quote',
    defaults: {
      margin: '',
      padding: '',
      quote: 'Great product, highly recommended!',
      author: 'John Doe',
      role: 'CEO, Acme Inc',
      avatar: '',
    },
    propertySchema: {
      margin: { type: 'text', label: 'Margin' },
      padding: { type: 'text', label: 'Padding' },
      quote: { type: 'textarea', label: 'Quote', rows: 3 },
      author: { type: 'text', label: 'Author' },
      role: { type: 'text', label: 'Role' },
      avatar: { type: 'text', label: 'Avatar URL' },
    },
  },
  container: {
    type: 'container',
    label: 'Container',
    icon: 'Layout',
    defaults: {
      margin: '',
      padding: '16px',
      width: '100%',
      maxWidth: '',
      direction: 'column',
      background: '',
      border: '',
      borderRadius: '',
      blocks: [],
    },
    propertySchema: {
      margin: { type: 'text', label: 'Margin' },
      padding: { type: 'text', label: 'Padding' },
      width: { type: 'text', label: 'Width' },
      maxWidth: { type: 'text', label: 'Max Width' },
      direction: { type: 'segmented', label: 'Layout', options: [
        { value: 'column', label: 'Vertical', icon: 'Rows' },
        { value: 'row', label: 'Horizontal', icon: 'Columns' },
      ] },
      background: { type: 'text', label: 'Background' },
      border: { type: 'text', label: 'Border' },
      borderRadius: { type: 'text', label: 'Border Radius' },
    },
    isContainer: true,
  },
};

export const BLOCK_CATEGORIES = {
  basic: { label: 'Basic', types: ['text', 'heading', 'image', 'button', 'divider', 'spacer'] },
  layout: { label: 'Layout', types: ['container'] },
  content: { label: 'Content', types: ['features', 'gallery', 'card', 'testimonial'] },
  commercial: { label: 'Commercial', types: ['pricing'] },
  advanced: { label: 'Advanced', types: ['code', 'html'] },
};

export function blockIcon(type) {
  const def = BLOCK_TYPES[type];
  return def ? def.icon : 'FileText';
}

export function createBlock(type, overrides = {}) {
  const def = BLOCK_TYPES[type];
  if (!def) throw new Error(`Unknown block type: ${type}`);
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    ...JSON.parse(JSON.stringify(def.defaults)),
    ...overrides,
  };
}

export function blockLabel(type) {
  return BLOCK_TYPES[type]?.label || type;
}