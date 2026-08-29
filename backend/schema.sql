CREATE TYPE userrole AS ENUM ('ARTISAN', 'BUYER', 'ADMIN') ;
CREATE TYPE applanguage AS ENUM ('EN', 'HI', 'GU') ;
CREATE TYPE productstatus AS ENUM ('DRAFT', 'PROCESSING', 'READY', 'PUBLISHED', 'OUT_OF_STOCK', 'ARCHIVED') ;
CREATE TYPE inventorytransactiontype AS ENUM ('SALE', 'RESTOCK', 'ADJUSTMENT', 'RESERVATION', 'CANCELLATION', 'RETURN') ;
CREATE TYPE orderstatus AS ENUM ('PENDING', 'ACCEPTED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REJECTED') ;
CREATE TYPE bulkorderstatus AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'NEGOTIATING', 'EXPIRED', 'CONVERTED_TO_ORDER') ;
CREATE TYPE notificationtype AS ENUM ('NEW_ORDER', 'BULK_ORDER', 'COUNTER_OFFER', 'PRICE_OPPORTUNITY', 'LOW_STOCK', 'AI_INSIGHT', 'SYSTEM') ;
CREATE TYPE messagerole AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL') ;

CREATE TABLE users (
	email VARCHAR(255) NOT NULL, 
	phone VARCHAR(20), 
	hashed_password VARCHAR(255), 
	name VARCHAR(255) NOT NULL, 
	address VARCHAR(255), 
	role userrole NOT NULL, 
	preferred_language applanguage NOT NULL, 
	voice_language applanguage NOT NULL, 
	is_verified BOOLEAN NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id)
)

 ;
CREATE INDEX ix_users_role ON users (role) ;
CREATE UNIQUE INDEX ix_users_email ON users (email) ;
CREATE UNIQUE INDEX ix_users_phone ON users (phone) ;

CREATE TABLE categories (
	parent_id UUID, 
	name VARCHAR(100) NOT NULL, 
	slug VARCHAR(100) NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(parent_id) REFERENCES categories (id)
)

 ;
CREATE UNIQUE INDEX ix_categories_slug ON categories (slug) ;
CREATE UNIQUE INDEX ix_categories_name ON categories (name) ;

CREATE TABLE market_data (
	category VARCHAR(100) NOT NULL, 
	source VARCHAR(100) NOT NULL, 
	price NUMERIC(10, 2) NOT NULL, 
	currency VARCHAR(10) NOT NULL, 
	location VARCHAR(255), 
	meta_data JSONB, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
)

 ;
CREATE INDEX ix_market_data_category ON market_data (category) ;

CREATE TABLE artisan_profiles (
	user_id UUID NOT NULL, 
	business_name VARCHAR(255) NOT NULL, 
	craft_type VARCHAR(100) NOT NULL, 
	location VARCHAR(255) NOT NULL, 
	city VARCHAR(100), 
	state VARCHAR(100) NOT NULL, 
	bio VARCHAR, 
	craft_story VARCHAR, 
	years_experience INTEGER, 
	profile_image VARCHAR, 
	products_count INTEGER NOT NULL, 
	orders_count INTEGER NOT NULL, 
	rating FLOAT NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_artisan_profiles_state ON artisan_profiles (state) ;
CREATE INDEX ix_artisan_profiles_business_name ON artisan_profiles (business_name) ;
CREATE INDEX ix_artisan_profiles_craft_type ON artisan_profiles (craft_type) ;

CREATE TABLE buyer_profiles (
	user_id UUID NOT NULL, 
	company_name VARCHAR(255) NOT NULL, 
	company_type VARCHAR(100), 
	location VARCHAR(255) NOT NULL, 
	city VARCHAR(100), 
	state VARCHAR(100), 
	gst_number VARCHAR(50), 
	business_description VARCHAR, 
	orders_completed INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_buyer_profiles_company_name ON buyer_profiles (company_name) ;

CREATE TABLE product_drafts (
	user_id UUID NOT NULL, 
	current_step VARCHAR(50) NOT NULL, 
	draft_data JSONB NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_product_drafts_user_id ON product_drafts (user_id) ;

CREATE TABLE orders (
	order_number VARCHAR(50) NOT NULL, 
	buyer_id UUID NOT NULL, 
	artisan_id UUID NOT NULL, 
	total_amount NUMERIC(10, 2) NOT NULL, 
	shipping_address TEXT, 
	expected_delivery TIMESTAMP WITHOUT TIME ZONE, 
	status orderstatus NOT NULL, 
	payment_status VARCHAR(50) NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(buyer_id) REFERENCES users (id), 
	FOREIGN KEY(artisan_id) REFERENCES users (id)
)

 ;
CREATE INDEX ix_orders_status ON orders (status) ;
CREATE UNIQUE INDEX ix_orders_order_number ON orders (order_number) ;
CREATE INDEX ix_orders_artisan_id ON orders (artisan_id) ;
CREATE INDEX ix_orders_buyer_id ON orders (buyer_id) ;

CREATE TABLE voice_recordings (
	user_id UUID NOT NULL, 
	product_id UUID, 
	storage_url VARCHAR(1024) NOT NULL, 
	language VARCHAR(10) NOT NULL, 
	duration_seconds INTEGER, 
	file_format VARCHAR(20) NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

 ;

CREATE TABLE notifications (
	user_id UUID NOT NULL, 
	type notificationtype NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	message TEXT NOT NULL, 
	is_read BOOLEAN NOT NULL, 
	related_entity_type VARCHAR(50), 
	related_entity_id VARCHAR(100), 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_notifications_user_id ON notifications (user_id) ;
CREATE INDEX ix_notifications_is_read ON notifications (is_read) ;

CREATE TABLE ai_conversations (
	user_id UUID NOT NULL, 
	title VARCHAR(255), 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_ai_conversations_user_id ON ai_conversations (user_id) ;

CREATE TABLE business_insights (
	artisan_id UUID NOT NULL, 
	type VARCHAR(100) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	description TEXT NOT NULL, 
	severity VARCHAR(50) NOT NULL, 
	data_source VARCHAR(100) NOT NULL, 
	confidence FLOAT, 
	is_read BOOLEAN NOT NULL, 
	expires_at TIMESTAMP WITH TIME ZONE, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(artisan_id) REFERENCES users (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_business_insights_artisan_id ON business_insights (artisan_id) ;

CREATE TABLE products (
	artisan_id UUID NOT NULL, 
	category_id UUID, 
	name VARCHAR(255) NOT NULL, 
	description TEXT NOT NULL, 
	short_description VARCHAR(500), 
	material VARCHAR(100) NOT NULL, 
	craft_type VARCHAR(100) NOT NULL, 
	color VARCHAR(50), 
	origin VARCHAR(255) NOT NULL, 
	production_time VARCHAR(100), 
	sku VARCHAR(100), 
	attributes JSONB, 
	price FLOAT NOT NULL, 
	status productstatus NOT NULL, 
	views INTEGER NOT NULL, 
	orders INTEGER NOT NULL, 
	rating FLOAT, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(artisan_id) REFERENCES artisan_profiles (user_id) ON DELETE CASCADE, 
	FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE SET NULL
)

 ;
CREATE UNIQUE INDEX ix_products_sku ON products (sku) ;
CREATE INDEX ix_products_name ON products (name) ;
CREATE INDEX ix_products_craft_type ON products (craft_type) ;
CREATE INDEX ix_products_price ON products (price) ;
CREATE INDEX ix_products_category_id ON products (category_id) ;
CREATE INDEX ix_products_status ON products (status) ;
CREATE INDEX ix_products_material ON products (material) ;
CREATE INDEX ix_products_artisan_id ON products (artisan_id) ;

CREATE TABLE order_timeline (
	order_id UUID NOT NULL, 
	status_label VARCHAR(100) NOT NULL, 
	status_state VARCHAR(50) NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(order_id) REFERENCES orders (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_order_timeline_order_id ON order_timeline (order_id) ;

CREATE TABLE payments (
	order_id UUID NOT NULL, 
	transaction_reference VARCHAR(255), 
	amount NUMERIC(10, 2) NOT NULL, 
	currency VARCHAR(10) NOT NULL, 
	provider VARCHAR(50) NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(order_id) REFERENCES orders (id), 
	UNIQUE (transaction_reference)
)

 ;

CREATE TABLE speech_transcripts (
	recording_id UUID NOT NULL, 
	language VARCHAR(10) NOT NULL, 
	original_transcript TEXT NOT NULL, 
	corrected_transcript TEXT, 
	confidence_score FLOAT NOT NULL, 
	stt_provider VARCHAR(100) NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (recording_id), 
	FOREIGN KEY(recording_id) REFERENCES voice_recordings (id) ON DELETE CASCADE
)

 ;

CREATE TABLE ai_messages (
	conversation_id UUID NOT NULL, 
	role messagerole NOT NULL, 
	content TEXT NOT NULL, 
	intent VARCHAR(100), 
	meta_data JSONB, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(conversation_id) REFERENCES ai_conversations (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_ai_messages_conversation_id ON ai_messages (conversation_id) ;

CREATE TABLE product_images (
	product_id UUID NOT NULL, 
	url VARCHAR(1024) NOT NULL, 
	original_url VARCHAR(1024), 
	is_enhanced BOOLEAN NOT NULL, 
	sort_order INTEGER NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_product_images_product_id ON product_images (product_id) ;

CREATE TABLE product_translations (
	id UUID NOT NULL, 
	product_id UUID NOT NULL, 
	language_code applanguage NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	description TEXT NOT NULL, 
	short_description VARCHAR(500), 
	is_ai_generated BOOLEAN NOT NULL, 
	reviewed_by_user BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uix_product_language UNIQUE (product_id, language_code), 
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_product_translations_product_id ON product_translations (product_id) ;
CREATE INDEX ix_product_translations_language_code ON product_translations (language_code) ;

CREATE TABLE product_keywords (
	id UUID NOT NULL, 
	product_id UUID NOT NULL, 
	keyword VARCHAR(100) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uix_product_keyword UNIQUE (product_id, keyword), 
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_product_keywords_product_id ON product_keywords (product_id) ;
CREATE INDEX ix_product_keywords_keyword ON product_keywords (keyword) ;

CREATE TABLE inventory (
	product_id UUID NOT NULL, 
	available_quantity INTEGER NOT NULL, 
	reserved_quantity INTEGER NOT NULL, 
	sold_quantity INTEGER NOT NULL, 
	low_stock_threshold INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (product_id), 
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
)

 ;

CREATE TABLE inventory_transactions (
	product_id UUID NOT NULL, 
	transaction_type inventorytransactiontype NOT NULL, 
	quantity_change INTEGER NOT NULL, 
	reference_id VARCHAR(100), 
	notes VARCHAR(255), 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_inventory_transactions_product_id ON inventory_transactions (product_id) ;

CREATE TABLE order_items (
	order_id UUID NOT NULL, 
	product_id UUID, 
	product_name_snapshot VARCHAR(255) NOT NULL, 
	product_image_snapshot VARCHAR(1024), 
	quantity INTEGER NOT NULL, 
	unit_price NUMERIC(10, 2) NOT NULL, 
	subtotal NUMERIC(10, 2) NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(order_id) REFERENCES orders (id) ON DELETE CASCADE, 
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE SET NULL
)

 ;
CREATE INDEX ix_order_items_order_id ON order_items (order_id) ;

CREATE TABLE bulk_order_requests (
	buyer_id UUID NOT NULL, 
	product_id UUID NOT NULL, 
	quantity INTEGER NOT NULL, 
	target_price_per_unit NUMERIC(10, 2) NOT NULL, 
	delivery_days INTEGER NOT NULL, 
	notes TEXT, 
	status bulkorderstatus NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(buyer_id) REFERENCES users (id), 
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_bulk_order_requests_status ON bulk_order_requests (status) ;
CREATE INDEX ix_bulk_order_requests_buyer_id ON bulk_order_requests (buyer_id) ;
CREATE INDEX ix_bulk_order_requests_product_id ON bulk_order_requests (product_id) ;

CREATE TABLE price_predictions (
	product_id UUID NOT NULL, 
	input_cost NUMERIC(10, 2) NOT NULL, 
	recommended_price NUMERIC(10, 2) NOT NULL, 
	min_price NUMERIC(10, 2) NOT NULL, 
	max_price NUMERIC(10, 2) NOT NULL, 
	estimated_profit NUMERIC(10, 2) NOT NULL, 
	confidence FLOAT NOT NULL, 
	model_name VARCHAR(100) NOT NULL, 
	model_version VARCHAR(50) NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_price_predictions_product_id ON price_predictions (product_id) ;

CREATE TABLE ai_processing_jobs (
	product_id UUID, 
	job_type VARCHAR(100) NOT NULL, 
	model_provider VARCHAR(100) NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	input_data JSONB NOT NULL, 
	output_data JSONB, 
	error_message TEXT, 
	started_at TIMESTAMP WITH TIME ZONE, 
	completed_at TIMESTAMP WITH TIME ZONE, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
)

 ;
CREATE INDEX ix_ai_processing_jobs_status ON ai_processing_jobs (status) ;
CREATE INDEX ix_ai_processing_jobs_job_type ON ai_processing_jobs (job_type) ;

CREATE TABLE reviews (
	reviewer_id UUID NOT NULL, 
	artisan_id UUID NOT NULL, 
	product_id UUID, 
	order_id UUID, 
	rating INTEGER NOT NULL, 
	review_text TEXT, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(reviewer_id) REFERENCES users (id), 
	FOREIGN KEY(artisan_id) REFERENCES users (id), 
	FOREIGN KEY(product_id) REFERENCES products (id), 
	FOREIGN KEY(order_id) REFERENCES orders (id)
)

 ;
CREATE INDEX ix_reviews_artisan_id ON reviews (artisan_id) ;

CREATE TABLE counter_offers (
	bulk_request_id UUID NOT NULL, 
	sender_id UUID NOT NULL, 
	receiver_id UUID NOT NULL, 
	quantity INTEGER NOT NULL, 
	price_per_unit NUMERIC(10, 2) NOT NULL, 
	delivery_days INTEGER NOT NULL, 
	notes TEXT, 
	status VARCHAR(50) NOT NULL, 
	id UUID NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(bulk_request_id) REFERENCES bulk_order_requests (id) ON DELETE CASCADE, 
	FOREIGN KEY(sender_id) REFERENCES users (id), 
	FOREIGN KEY(receiver_id) REFERENCES users (id)
)

 ;
CREATE INDEX ix_counter_offers_bulk_request_id ON counter_offers (bulk_request_id) ;
