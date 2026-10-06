import { createVariableScope } from '../context/BlockVariableContext.jsx';

// Service field variables usable inside canvas block content, e.g.
// {{service.name}} or {{service.starting_price}}. Mirrors productVariables.js.

const asList = (value) => (Array.isArray(value) ? value : []);
const joinList = (value, sep = ', ') => asList(value).filter(Boolean).join(sep);

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export const SERVICE_VARIABLE_GROUPS = [
  {
    group: 'Basics',
    variables: [
      { token: 'service.name', label: 'Service name', example: 'WooCommerce Development' },
      { token: 'service.short_description', label: 'Short description', example: 'Custom theme development' },
      { token: 'service.description', label: 'Full description', example: 'Long overview copy' },
      { token: 'service.icon', label: 'Icon name', example: 'Globe' },
    ],
  },
  {
    group: 'Pricing & timeline',
    variables: [
      { token: 'service.starting_price', label: 'Starting price', example: '$15,000' },
      { token: 'service.timeline', label: 'Timeline', example: '6-12 weeks' },
      { token: 'service.note', label: 'Note', example: 'Price excludes hosting' },
    ],
  },
  {
    group: 'Features',
    variables: [
      { token: 'service.features_count', label: 'Feature count', example: '6' },
      { token: 'service.features_first', label: 'First feature', example: 'Custom theme development' },
      { token: 'service.features_joined', label: 'All features (comma separated)', example: 'Theme work, Plugin work' },
    ],
  },
  {
    group: 'Deliverables',
    variables: [
      { token: 'service.deliverables_count', label: 'Deliverable count', example: '5' },
      { token: 'service.deliverables_first', label: 'First deliverable', example: 'Production-ready code' },
      { token: 'service.deliverables_joined', label: 'All deliverables (comma separated)', example: 'Code, Docs' },
    ],
  },
  {
    group: 'Tiers',
    variables: [
      { token: 'service.tiers_count', label: 'Tier count', example: '3' },
      { token: 'service.tiers_joined', label: 'All tier names (comma separated)', example: 'Essential, Growth' },
      { token: 'service.tier_1_name', label: 'Tier 1 name', example: 'Essential' },
      { token: 'service.tier_1_price', label: 'Tier 1 price', example: '$500/mo' },
      { token: 'service.tier_2_name', label: 'Tier 2 name', example: 'Growth' },
      { token: 'service.tier_2_price', label: 'Tier 2 price', example: '$1,200/mo' },
      { token: 'service.tier_3_name', label: 'Tier 3 name', example: 'Scale' },
      { token: 'service.tier_3_price', label: 'Tier 3 price', example: '$2,800/mo' },
    ],
  },
  {
    group: 'FAQs',
    variables: [
      { token: 'service.faqs_count', label: 'FAQ count', example: '4' },
      { token: 'service.faq_1_question', label: 'FAQ 1 question', example: 'How does it work?' },
      { token: 'service.faq_1_answer', label: 'FAQ 1 answer', example: 'Long answer copy' },
      { token: 'service.faq_2_question', label: 'FAQ 2 question', example: 'What is included?' },
      { token: 'service.faq_2_answer', label: 'FAQ 2 answer', example: 'Long answer copy' },
    ],
  },
  {
    group: 'Links',
    variables: [
      { token: 'service.url', label: 'Service page URL', example: '/services/woocommerce' },
      { token: 'service.landing_url', label: 'Landing page URL', example: '/s/woocommerce' },
      { token: 'service.contact_url', label: 'Contact page URL', example: '/contact' },
      { token: 'service.services_index_url', label: 'All services URL', example: '/services' },
    ],
  },
  {
    group: 'Meta',
    variables: [
      { token: 'service.status', label: 'Status', example: 'active' },
      { token: 'service.is_featured', label: 'Featured', example: 'true' },
      { token: 'service.sort_order', label: 'Sort order', example: '0' },
      { token: 'service.updated_at', label: 'Last updated', example: '2026-10-04' },
    ],
  },
];

export const SERVICE_VARIABLES = SERVICE_VARIABLE_GROUPS.flatMap((g) => g.variables);

function tierAt(tiers, index) {
  const list = asList(tiers);
  const entry = list[index];
  return entry && typeof entry === 'object' ? entry : {};
}

/** Flat map of token -> resolved value for one service. */
export function buildServiceVariableValues(service) {
  if (!service) return {};
  const slug = service.slug || '';

  const values = {
    'service.name': service.name || '',
    'service.short_description': service.short_description || '',
    'service.description': service.description || '',
    'service.icon': service.icon || '',

    'service.starting_price': service.starting_price || '',
    'service.timeline': service.timeline || '',
    'service.note': service.note || '',

    'service.features_count': String(asList(service.features).length),
    'service.features_first': asList(service.features)[0] || '',
    'service.features_joined': joinList(service.features),

    'service.deliverables_count': String(asList(service.deliverables).length),
    'service.deliverables_first': asList(service.deliverables)[0] || '',
    'service.deliverables_joined': joinList(service.deliverables),

    'service.tiers_count': String(asList(service.tiers).length),
    'service.tiers_joined': joinList(asList(service.tiers).map((t) => t?.name)),

    'service.faqs_count': String(asList(service.faqs).length),
    'service.faq_1_question': asList(service.faqs)[0]?.question || '',
    'service.faq_1_answer': asList(service.faqs)[0]?.answer || '',
    'service.faq_2_question': asList(service.faqs)[1]?.question || '',
    'service.faq_2_answer': asList(service.faqs)[1]?.answer || '',

    'service.url': slug ? `/services/${slug}` : '',
    'service.landing_url': slug ? `/s/${slug}` : '',
    'service.contact_url': '/contact',
    'service.services_index_url': '/services',

    'service.status': service.status || '',
    'service.is_featured': service.is_featured ? 'true' : 'false',
    'service.sort_order': service.sort_order ?? '',
    'service.updated_at': formatDate(service.updated_at),
  };

  for (let i = 0; i < 3; i += 1) {
    const entry = tierAt(service.tiers, i);
    values[`service.tier_${i + 1}_name`] = entry.name || '';
    values[`service.tier_${i + 1}_price`] = entry.price || '';
  }

  return values;
}

/** Variable scope for rendering service content. */
export function serviceVariableScope(service) {
  return createVariableScope(SERVICE_VARIABLE_GROUPS, buildServiceVariableValues(service));
}