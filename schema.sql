--
-- PostgreSQL database dump
--

\restrict BpIkwHXwchpIliUdVzOS0jPXqxFjCP0SvaNLXcyOZU2gtKH9oIt9S7CuyQ9K49f

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: angled_side; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.angled_side AS ENUM (
    'LEFT',
    'RIGHT'
);


--
-- Name: calculation_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.calculation_type AS ENUM (
    'FIXED',
    'PER_ITEM',
    'MULTIPLIER'
);


--
-- Name: delivery_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.delivery_method AS ENUM (
    'COLLECTION',
    'DELIVERY'
);


--
-- Name: file_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.file_type AS ENUM (
    'SKETCHUP',
    'PDF',
    'DXF',
    'IMAGE',
    'OTHER'
);


--
-- Name: hinge_position_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hinge_position_type AS ENUM (
    'TOP',
    'BOTTOM'
);


--
-- Name: hinge_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hinge_type AS ENUM (
    'SCREW_POINTS',
    'INSERTA'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'CONFIRMED',
    'IN_PRODUCTION',
    'READY',
    'DISPATCHED',
    'DELIVERED',
    'CANCELLED'
);


--
-- Name: panel_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.panel_type AS ENUM (
    'STANDARD_12MM',
    'REEDED_19MM',
    'MELAMINE_18MM',
    'FRETWORK',
    'GLASS',
    'NONE'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'PAID',
    'REFUNDED'
);


--
-- Name: production_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.production_status AS ENUM (
    'NOT_STARTED',
    'FILES_GENERATED',
    'CNC_QUEUED',
    'CNC_COMPLETE',
    'ASSEMBLY',
    'QC_CHECK',
    'PACKED',
    'COMPLETE'
);


--
-- Name: setting_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.setting_type AS ENUM (
    'STRING',
    'NUMBER',
    'BOOLEAN',
    'JSON'
);


--
-- Name: sync_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sync_status AS ENUM (
    'SUCCESS',
    'FAILED',
    'PENDING'
);


--
-- Name: sync_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sync_type AS ENUM (
    'CREATE',
    'UPDATE',
    'WEBHOOK'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    company_name character varying(200) NOT NULL,
    contact_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    invoice_address_line1 character varying(255) NOT NULL,
    invoice_address_line2 character varying(255),
    invoice_city character varying(100) NOT NULL,
    invoice_postcode character varying(20) NOT NULL,
    invoice_country character varying(50) DEFAULT 'UK'::character varying,
    delivery_address_line1 character varying(255),
    delivery_address_line2 character varying(255),
    delivery_city character varying(100),
    delivery_postcode character varying(20),
    is_trained_customer boolean DEFAULT false,
    preferred_hinge_spacing character varying(100),
    default_border_width integer DEFAULT 90,
    shopify_customer_id character varying(50),
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: delivery_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_options (
    id integer NOT NULL,
    delivery_code character varying(20) NOT NULL,
    delivery_name character varying(100) NOT NULL,
    base_price numeric(10,2) NOT NULL,
    price_per_door numeric(10,2) DEFAULT 0.00,
    max_distance_miles integer,
    is_active boolean DEFAULT true
);


--
-- Name: delivery_options_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.delivery_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: delivery_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.delivery_options_id_seq OWNED BY public.delivery_options.id;


--
-- Name: door_styles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.door_styles (
    id integer NOT NULL,
    style_code character varying(20) NOT NULL,
    style_name character varying(100) NOT NULL,
    description text,
    thickness_mm integer DEFAULT 22 NOT NULL,
    panel_thickness_mm integer DEFAULT 12,
    min_border_width_mm integer DEFAULT 50 NOT NULL,
    supports_angled boolean DEFAULT true,
    supports_mid_rails boolean DEFAULT true,
    price_adjustment numeric(10,2) DEFAULT 0.00,
    is_active boolean DEFAULT true,
    rebate_width_mm integer DEFAULT 10,
    rebate_depth_mm integer DEFAULT 14,
    front_face_thickness_mm integer DEFAULT 8,
    corner_radius_mm numeric(4,1) DEFAULT 2.5
);


--
-- Name: door_styles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.door_styles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: door_styles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.door_styles_id_seq OWNED BY public.door_styles.id;


--
-- Name: finish_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finish_options (
    id integer NOT NULL,
    finish_code character varying(30) NOT NULL,
    finish_name character varying(100) NOT NULL,
    description text,
    price_multiplier numeric(4,2) DEFAULT 1.00,
    fixed_surcharge numeric(10,2) DEFAULT 0.00,
    is_active boolean DEFAULT true
);


--
-- Name: finish_options_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.finish_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: finish_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.finish_options_id_seq OWNED BY public.finish_options.id;


--
-- Name: order_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_attachments (
    id integer NOT NULL,
    order_id integer NOT NULL,
    item_id integer,
    file_name character varying(255) NOT NULL,
    file_type public.file_type NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size_bytes integer,
    description character varying(255),
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL,
    uploaded_by character varying(100)
);


--
-- Name: order_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_attachments_id_seq OWNED BY public.order_attachments.id;


--
-- Name: order_item_hinges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_item_hinges (
    id integer NOT NULL,
    cup_diameter_mm integer DEFAULT 35,
    cup_depth_mm integer DEFAULT 13,
    order_item_id integer NOT NULL,
    hinge_type public.hinge_type DEFAULT 'SCREW_POINTS'::public.hinge_type NOT NULL,
    position_from_bottom_mm integer NOT NULL,
    side public.angled_side DEFAULT 'LEFT'::public.angled_side NOT NULL,
    gap_to_edge_mm integer DEFAULT 5
);


--
-- Name: order_item_hinges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_item_hinges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_item_hinges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_item_hinges_id_seq OWNED BY public.order_item_hinges.id;


--
-- Name: order_item_mid_rails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_item_mid_rails (
    id integer NOT NULL,
    item_id integer NOT NULL,
    rail_number integer NOT NULL,
    position_from_bottom_mm integer NOT NULL,
    rail_width_mm integer
);


--
-- Name: order_item_mid_rails_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_item_mid_rails_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_item_mid_rails_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_item_mid_rails_id_seq OWNED BY public.order_item_mid_rails.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    line_number integer NOT NULL,
    item_reference character varying(50),
    quantity integer DEFAULT 1 NOT NULL,
    style_id integer NOT NULL,
    finish_id integer NOT NULL,
    height_mm integer NOT NULL,
    width_mm integer NOT NULL,
    is_angled boolean DEFAULT false,
    angled_shorter_side public.angled_side,
    angled_short_height_mm integer,
    angled_flat_top_width_mm integer,
    number_of_panels integer DEFAULT 1,
    panel_corner_squaring boolean DEFAULT false,
    border_bottom_rail integer,
    border_top_rail integer,
    border_left_stile integer,
    border_right_stile integer,
    border_mid_rail integer,
    hinge_quantity integer DEFAULT 0,
    hinged_side public.angled_side,
    hinge_spacing_pattern character varying(100),
    door_area_sqm numeric(6,4),
    base_price numeric(10,2) NOT NULL,
    angled_surcharge numeric(10,2) DEFAULT 0.00,
    mid_rail_surcharge numeric(10,2) DEFAULT 0.00,
    squaring_surcharge numeric(10,2) DEFAULT 0.00,
    hinge_surcharge numeric(10,2) DEFAULT 0.00,
    style_adjustment numeric(10,2) DEFAULT 0.00,
    finish_adjustment numeric(10,2) DEFAULT 0.00,
    manual_adjustment numeric(10,2) DEFAULT 0.00,
    unit_price_exc_vat numeric(10,2) NOT NULL,
    line_total_exc_vat numeric(10,2) NOT NULL,
    comments text,
    dxf_file_generated boolean DEFAULT false,
    dxf_file_path character varying(500),
    production_notes text,
    panel_type public.panel_type DEFAULT 'STANDARD_12MM'::public.panel_type,
    panel_thickness_mm integer DEFAULT 12
);


--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    order_reference character varying(50) NOT NULL,
    customer_job_reference character varying(100),
    order_date timestamp without time zone DEFAULT now() NOT NULL,
    date_required timestamp without time zone NOT NULL,
    delivery_method public.delivery_method NOT NULL,
    delivery_address_line1 character varying(255),
    delivery_address_line2 character varying(255),
    delivery_city character varying(100),
    delivery_postcode character varying(20),
    special_requirements text,
    subtotal_exc_vat numeric(10,2) NOT NULL,
    delivery_charge numeric(10,2) DEFAULT 0.00,
    additional_charges numeric(10,2) DEFAULT 0.00,
    additional_charges_desc character varying(255),
    total_exc_vat numeric(10,2) NOT NULL,
    vat_amount numeric(10,2) NOT NULL,
    total_inc_vat numeric(10,2) NOT NULL,
    order_status public.order_status DEFAULT 'DRAFT'::public.order_status,
    payment_status public.payment_status DEFAULT 'PENDING'::public.payment_status,
    shopify_order_id character varying(50),
    shopify_draft_order_id character varying(50),
    production_status public.production_status DEFAULT 'NOT_STARTED'::public.production_status,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: price_brackets_height; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_brackets_height (
    id integer NOT NULL,
    bracket_name character varying(50) NOT NULL,
    max_height_mm integer NOT NULL,
    sort_order integer NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: price_brackets_height_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.price_brackets_height_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: price_brackets_height_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.price_brackets_height_id_seq OWNED BY public.price_brackets_height.id;


--
-- Name: price_brackets_width; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_brackets_width (
    id integer NOT NULL,
    bracket_name character varying(50) NOT NULL,
    max_width_mm integer NOT NULL,
    sort_order integer NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: price_brackets_width_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.price_brackets_width_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: price_brackets_width_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.price_brackets_width_id_seq OWNED BY public.price_brackets_width.id;


--
-- Name: pricing_matrix; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pricing_matrix (
    id integer NOT NULL,
    height_bracket_id integer NOT NULL,
    width_bracket_id integer NOT NULL,
    base_price_exc_vat numeric(10,2) NOT NULL,
    is_valid_combination boolean DEFAULT true
);


--
-- Name: pricing_matrix_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pricing_matrix_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pricing_matrix_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pricing_matrix_id_seq OWNED BY public.pricing_matrix.id;


--
-- Name: shopify_sync_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopify_sync_log (
    id integer NOT NULL,
    order_id integer,
    sync_type public.sync_type NOT NULL,
    shopify_response jsonb,
    status public.sync_status DEFAULT 'PENDING'::public.sync_status,
    error_message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: shopify_sync_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shopify_sync_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shopify_sync_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shopify_sync_log_id_seq OWNED BY public.shopify_sync_log.id;


--
-- Name: surcharge_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.surcharge_types (
    id integer NOT NULL,
    surcharge_code character varying(30) NOT NULL,
    surcharge_name character varying(100) NOT NULL,
    calculation_type public.calculation_type NOT NULL,
    amount numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: surcharge_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.surcharge_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: surcharge_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.surcharge_types_id_seq OWNED BY public.surcharge_types.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    setting_key character varying(50) NOT NULL,
    setting_value character varying(500) NOT NULL,
    setting_type public.setting_type DEFAULT 'STRING'::public.setting_type,
    description character varying(255),
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: delivery_options id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_options ALTER COLUMN id SET DEFAULT nextval('public.delivery_options_id_seq'::regclass);


--
-- Name: door_styles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.door_styles ALTER COLUMN id SET DEFAULT nextval('public.door_styles_id_seq'::regclass);


--
-- Name: finish_options id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finish_options ALTER COLUMN id SET DEFAULT nextval('public.finish_options_id_seq'::regclass);


--
-- Name: order_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_attachments ALTER COLUMN id SET DEFAULT nextval('public.order_attachments_id_seq'::regclass);


--
-- Name: order_item_hinges id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_item_hinges ALTER COLUMN id SET DEFAULT nextval('public.order_item_hinges_id_seq'::regclass);


--
-- Name: order_item_mid_rails id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_item_mid_rails ALTER COLUMN id SET DEFAULT nextval('public.order_item_mid_rails_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: price_brackets_height id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_brackets_height ALTER COLUMN id SET DEFAULT nextval('public.price_brackets_height_id_seq'::regclass);


--
-- Name: price_brackets_width id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_brackets_width ALTER COLUMN id SET DEFAULT nextval('public.price_brackets_width_id_seq'::regclass);


--
-- Name: pricing_matrix id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_matrix ALTER COLUMN id SET DEFAULT nextval('public.pricing_matrix_id_seq'::regclass);


--
-- Name: shopify_sync_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_sync_log ALTER COLUMN id SET DEFAULT nextval('public.shopify_sync_log_id_seq'::regclass);


--
-- Name: surcharge_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surcharge_types ALTER COLUMN id SET DEFAULT nextval('public.surcharge_types_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: customers customers_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_unique UNIQUE (email);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: delivery_options delivery_options_delivery_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_options
    ADD CONSTRAINT delivery_options_delivery_code_unique UNIQUE (delivery_code);


--
-- Name: delivery_options delivery_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_options
    ADD CONSTRAINT delivery_options_pkey PRIMARY KEY (id);


--
-- Name: door_styles door_styles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.door_styles
    ADD CONSTRAINT door_styles_pkey PRIMARY KEY (id);


--
-- Name: door_styles door_styles_style_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.door_styles
    ADD CONSTRAINT door_styles_style_code_unique UNIQUE (style_code);


--
-- Name: finish_options finish_options_finish_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finish_options
    ADD CONSTRAINT finish_options_finish_code_unique UNIQUE (finish_code);


--
-- Name: finish_options finish_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finish_options
    ADD CONSTRAINT finish_options_pkey PRIMARY KEY (id);


--
-- Name: order_attachments order_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_attachments
    ADD CONSTRAINT order_attachments_pkey PRIMARY KEY (id);


--
-- Name: order_item_hinges order_item_hinges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_item_hinges
    ADD CONSTRAINT order_item_hinges_pkey PRIMARY KEY (id);


--
-- Name: order_item_mid_rails order_item_mid_rails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_item_mid_rails
    ADD CONSTRAINT order_item_mid_rails_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_reference_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_reference_unique UNIQUE (order_reference);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: price_brackets_height price_brackets_height_max_height_mm_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_brackets_height
    ADD CONSTRAINT price_brackets_height_max_height_mm_unique UNIQUE (max_height_mm);


--
-- Name: price_brackets_height price_brackets_height_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_brackets_height
    ADD CONSTRAINT price_brackets_height_pkey PRIMARY KEY (id);


--
-- Name: price_brackets_width price_brackets_width_max_width_mm_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_brackets_width
    ADD CONSTRAINT price_brackets_width_max_width_mm_unique UNIQUE (max_width_mm);


--
-- Name: price_brackets_width price_brackets_width_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_brackets_width
    ADD CONSTRAINT price_brackets_width_pkey PRIMARY KEY (id);


--
-- Name: pricing_matrix pricing_matrix_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_matrix
    ADD CONSTRAINT pricing_matrix_pkey PRIMARY KEY (id);


--
-- Name: shopify_sync_log shopify_sync_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_sync_log
    ADD CONSTRAINT shopify_sync_log_pkey PRIMARY KEY (id);


--
-- Name: surcharge_types surcharge_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surcharge_types
    ADD CONSTRAINT surcharge_types_pkey PRIMARY KEY (id);


--
-- Name: surcharge_types surcharge_types_surcharge_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surcharge_types
    ADD CONSTRAINT surcharge_types_surcharge_code_unique UNIQUE (surcharge_code);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_setting_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_setting_key_unique UNIQUE (setting_key);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: idx_attachments_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attachments_order ON public.order_attachments USING btree (order_id);


--
-- Name: idx_customer_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_customer_email ON public.customers USING btree (email);


--
-- Name: idx_customer_shopify_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_shopify_id ON public.customers USING btree (shopify_customer_id);


--
-- Name: idx_date_required; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_date_required ON public.orders USING btree (date_required);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- Name: idx_order_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_order_ref ON public.orders USING btree (order_reference);


--
-- Name: idx_order_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_status ON public.orders USING btree (order_status);


--
-- Name: idx_shopify; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shopify ON public.orders USING btree (shopify_order_id);


--
-- Name: idx_sync_log_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sync_log_order ON public.shopify_sync_log USING btree (order_id);


--
-- Name: idx_sync_log_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sync_log_status ON public.shopify_sync_log USING btree (status);


--
-- Name: uk_bracket_combo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_bracket_combo ON public.pricing_matrix USING btree (height_bracket_id, width_bracket_id);


--
-- Name: uk_item_rail; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_item_rail ON public.order_item_mid_rails USING btree (item_id, rail_number);


--
-- Name: order_attachments order_attachments_item_id_order_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_attachments
    ADD CONSTRAINT order_attachments_item_id_order_items_id_fk FOREIGN KEY (item_id) REFERENCES public.order_items(id) ON DELETE SET NULL;


--
-- Name: order_attachments order_attachments_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_attachments
    ADD CONSTRAINT order_attachments_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_item_hinges order_item_hinges_order_item_id_order_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_item_hinges
    ADD CONSTRAINT order_item_hinges_order_item_id_order_items_id_fk FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- Name: order_item_mid_rails order_item_mid_rails_item_id_order_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_item_mid_rails
    ADD CONSTRAINT order_item_mid_rails_item_id_order_items_id_fk FOREIGN KEY (item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_finish_id_finish_options_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_finish_id_finish_options_id_fk FOREIGN KEY (finish_id) REFERENCES public.finish_options(id);


--
-- Name: order_items order_items_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_style_id_door_styles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_style_id_door_styles_id_fk FOREIGN KEY (style_id) REFERENCES public.door_styles(id);


--
-- Name: orders orders_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: pricing_matrix pricing_matrix_height_bracket_id_price_brackets_height_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_matrix
    ADD CONSTRAINT pricing_matrix_height_bracket_id_price_brackets_height_id_fk FOREIGN KEY (height_bracket_id) REFERENCES public.price_brackets_height(id);


--
-- Name: pricing_matrix pricing_matrix_width_bracket_id_price_brackets_width_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_matrix
    ADD CONSTRAINT pricing_matrix_width_bracket_id_price_brackets_width_id_fk FOREIGN KEY (width_bracket_id) REFERENCES public.price_brackets_width(id);


--
-- Name: shopify_sync_log shopify_sync_log_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopify_sync_log
    ADD CONSTRAINT shopify_sync_log_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict BpIkwHXwchpIliUdVzOS0jPXqxFjCP0SvaNLXcyOZU2gtKH9oIt9S7CuyQ9K49f

