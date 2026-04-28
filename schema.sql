-- ============================================================
-- ListaCerta — Schema inicial (MVP)
-- Postgres / Supabase compativel
-- ============================================================
-- Convenções:
--   - Todas tabelas em snake_case
--   - Todas tabelas tem id UUID, created_at, updated_at
--   - RLS habilitada em TODAS tabelas com dados pessoais
--   - Dados de menor (students) tem auditoria explicita
--   - Auth.users é gerenciado pelo Supabase Auth (Google OAuth)
-- ============================================================

-- Extensoes
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('parent', 'school_admin', 'platform_admin');
CREATE TYPE school_status AS ENUM ('pending_approval', 'approved', 'rejected', 'suspended');
CREATE TYPE list_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE procon_severity AS ENUM ('compliant', 'warning', 'violation');
CREATE TYPE retailer_slug AS ENUM ('kalunga', 'magalu', 'mercadolivre', 'amazon');
CREATE TYPE cart_strategy AS ENUM ('cheapest', 'fastest', 'recommended');
CREATE TYPE list_source AS ENUM ('school_upload_pdf', 'school_upload_photo', 'school_manual', 'whatsapp_capture', 'parent_upload');

-- ============================================================
-- USERS (extensão de auth.users)
-- ============================================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'parent',
    full_name TEXT,
    phone TEXT,
    cep TEXT,
    city TEXT DEFAULT 'Cuiabá',
    state TEXT DEFAULT 'MT',
    consent_marketing BOOLEAN DEFAULT FALSE,
    consent_analytics BOOLEAN DEFAULT TRUE,
    consent_terms_at TIMESTAMPTZ,
    consent_privacy_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Trigger: cria profile automaticamente quando usuario faz login pela primeira vez
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'parent'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SCHOOLS (cadastrada pelo proprio usuario; aprovacao posterior)
-- ============================================================

CREATE TABLE public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inep_code TEXT UNIQUE,                          -- codigo INEP quando vier do seed
    legal_name TEXT NOT NULL,                       -- razao social
    trade_name TEXT NOT NULL,                       -- nome fantasia (exibido)
    slug TEXT UNIQUE NOT NULL,                      -- /escola/[slug] na URL publica
    cnpj TEXT,
    city TEXT NOT NULL DEFAULT 'Cuiabá',
    state TEXT NOT NULL DEFAULT 'MT',
    cep TEXT,
    address TEXT,
    neighborhood TEXT,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    phone TEXT,
    email TEXT,
    website TEXT,
    status school_status NOT NULL DEFAULT 'pending_approval',
    rejected_reason TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schools_status ON public.schools(status);
CREATE INDEX idx_schools_city_state ON public.schools(city, state);
CREATE INDEX idx_schools_slug ON public.schools(slug);
CREATE INDEX idx_schools_search ON public.schools USING gin(to_tsvector('portuguese', trade_name || ' ' || legal_name || ' ' || COALESCE(neighborhood, '')));

-- Vinculo de school_admin com school (m:n)
CREATE TABLE public.school_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin',                      -- 'admin' | 'editor'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, school_id)
);

CREATE INDEX idx_school_admins_user ON public.school_admins(user_id);
CREATE INDEX idx_school_admins_school ON public.school_admins(school_id);

-- ============================================================
-- LISTS (lista de material publicada por uma escola)
-- ============================================================

CREATE TABLE public.lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    grade TEXT NOT NULL,                            -- "3º ano A", "Maternal II"
    teacher_name TEXT,
    school_year INT NOT NULL DEFAULT 2027,
    source list_source NOT NULL,
    raw_file_url TEXT,                              -- URL do PDF/foto original no Storage
    status list_status NOT NULL DEFAULT 'draft',
    procon_severity procon_severity DEFAULT 'compliant',
    procon_report JSONB,                            -- relatorio item-a-item da validacao Procon
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lists_school ON public.lists(school_id);
CREATE INDEX idx_lists_status ON public.lists(status);
CREATE INDEX idx_lists_school_year ON public.lists(school_year, school_id);

-- Itens da lista
CREATE TABLE public.list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
    position INT NOT NULL,                          -- ordem na lista
    name TEXT NOT NULL,                             -- "Caderno espiral 96 folhas"
    specification TEXT,                             -- "200x275mm"
    quantity INT NOT NULL DEFAULT 1,
    unit TEXT,                                      -- "unidade", "estojo", "pacote"
    notes TEXT,                                     -- observacao da escola
    procon_status procon_severity DEFAULT 'compliant',
    procon_reason TEXT,                             -- "veda marca especifica" etc.
    catalog_match_id UUID,                          -- referencia ao catalog_items quando matched
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_list_items_list ON public.list_items(list_id);

-- ============================================================
-- CATALOG (SKUs seed mockados manualmente)
-- ============================================================

CREATE TABLE public.catalog_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_name TEXT NOT NULL,                   -- "Caderno espiral 96 folhas universitario"
    category TEXT NOT NULL,                         -- "caderno", "lapis", "cola", etc
    keywords TEXT[],                                -- ["caderno", "espiral", "96", "universitario"]
    typical_specs JSONB,                            -- { "gramatura": "75g/m2", "dimensao": "200x275mm" }
    typical_unit TEXT DEFAULT 'unidade',
    sample_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_catalog_keywords ON public.catalog_items USING gin(keywords);
CREATE INDEX idx_catalog_search ON public.catalog_items USING gin(to_tsvector('portuguese', canonical_name));

-- Mapeamento item-do-catalogo → URL de cada varejista
CREATE TABLE public.retailer_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
    retailer retailer_slug NOT NULL,
    search_url TEXT NOT NULL,                       -- URL de busca no varejista
    estimated_price NUMERIC(10,2),                  -- estimativa para ordenacao
    last_checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(catalog_item_id, retailer)
);

CREATE INDEX idx_retailer_links_catalog ON public.retailer_links(catalog_item_id);
CREATE INDEX idx_retailer_links_retailer ON public.retailer_links(retailer);

-- ============================================================
-- PARENT JOURNEY (cadastro de aluno + carrinhos)
-- ============================================================

-- Aluno (DADO DE MENOR — Art. 14 LGPD)
-- Apenas primeiro nome + escola/turma. Sem foto, CPF, RG, etc.
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,                       -- apenas primeiro nome
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    grade TEXT,                                     -- texto livre
    list_id UUID REFERENCES public.lists(id) ON DELETE SET NULL,
    parental_consent_at TIMESTAMPTZ NOT NULL,       -- data do consentimento
    parental_consent_version TEXT NOT NULL,         -- versao do termo aceito
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_parent ON public.students(parent_id);
CREATE INDEX idx_students_school ON public.students(school_id);

-- Auditoria de acesso a dados de menor (boa pratica LGPD reforcada)
CREATE TABLE public.students_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    accessed_by UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,                           -- 'read', 'update', 'delete'
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_access_student ON public.students_access_log(student_id);
CREATE INDEX idx_students_access_at ON public.students_access_log(accessed_at);

-- Carrinho gerado pela IA
CREATE TABLE public.carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES public.lists(id),
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    short_code TEXT UNIQUE NOT NULL,                -- "8847x" — usado em listacerta.app/c/8847x
    items_already_owned UUID[],                     -- list_item ids marcados como "ja tenho"
    options JSONB NOT NULL,                         -- 3 strategies geradas pela IA
    selected_strategy cart_strategy,                -- escolha do pai
    selected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_carts_parent ON public.carts(parent_id);
CREATE INDEX idx_carts_list ON public.carts(list_id);
CREATE INDEX idx_carts_short_code ON public.carts(short_code);

-- Cliques em deep links (atribuicao para futuro retail media)
CREATE TABLE public.deep_link_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.profiles(id),
    retailer retailer_slug NOT NULL,
    item_count INT,
    estimated_subtotal NUMERIC(10,2),
    clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clicks_cart ON public.deep_link_clicks(cart_id);
CREATE INDEX idx_clicks_retailer ON public.deep_link_clicks(retailer);
CREATE INDEX idx_clicks_at ON public.deep_link_clicks(clicked_at);

-- ============================================================
-- COMUNICACAO (escola → pais)
-- ============================================================

CREATE TABLE public.communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    list_id UUID REFERENCES public.lists(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_to_count INT,
    read_count INT DEFAULT 0,
    sent_by UUID REFERENCES public.profiles(id),
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_communications_school ON public.communications(school_id);

-- ============================================================
-- WHATSAPP CAPTURE QUEUE
-- (lista enviada via WhatsApp aguardando processamento humano + IA)
-- ============================================================

CREATE TABLE public.whatsapp_captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_phone TEXT NOT NULL,
    media_url TEXT,                                 -- URL no Storage
    school_name_hint TEXT,                          -- texto que veio junto na msg
    parent_id UUID REFERENCES public.profiles(id),  -- preenchido se identificado
    status TEXT NOT NULL DEFAULT 'received',        -- 'received' | 'processing' | 'done' | 'failed'
    parsed_list JSONB,                              -- resultado do Gemini
    cart_id UUID REFERENCES public.carts(id),       -- resultado final
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_wa_status ON public.whatsapp_captures(status);

-- ============================================================
-- TRIGGERS DE updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_schools_updated BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_lists_updated BEFORE UPDATE ON public.lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- profiles: o usuario ve e edita o proprio profile; admin ve tudo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_self_select ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY profiles_admin_all ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- schools: SELECT publico para escolas approved (landing publica)
-- INSERT publico (qualquer logado pode cadastrar pendente)
-- UPDATE so do school_admin daquela escola ou platform_admin
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY schools_select_approved_or_own ON public.schools
  FOR SELECT USING (
    status = 'approved'
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.school_admins sa WHERE sa.school_id = schools.id AND sa.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

CREATE POLICY schools_insert_authenticated ON public.schools
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY schools_update_admin ON public.schools
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.school_admins sa WHERE sa.school_id = schools.id AND sa.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- school_admins: usuario ve seus vinculos; platform_admin ve todos
ALTER TABLE public.school_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY school_admins_self ON public.school_admins
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- lists: SELECT publico para published em escolas approved; INSERT/UPDATE so school_admin
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY lists_select_published ON public.lists
  FOR SELECT USING (
    (status = 'published' AND EXISTS (SELECT 1 FROM public.schools s WHERE s.id = lists.school_id AND s.status = 'approved'))
    OR EXISTS (SELECT 1 FROM public.school_admins sa WHERE sa.school_id = lists.school_id AND sa.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

CREATE POLICY lists_modify_school_admin ON public.lists
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.school_admins sa WHERE sa.school_id = lists.school_id AND sa.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- list_items: herda visibilidade da list pai
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY list_items_via_list ON public.list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.lists l
      WHERE l.id = list_items.list_id
        AND (
          (l.status = 'published' AND EXISTS (SELECT 1 FROM public.schools s WHERE s.id = l.school_id AND s.status = 'approved'))
          OR EXISTS (SELECT 1 FROM public.school_admins sa WHERE sa.school_id = l.school_id AND sa.user_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
        )
    )
  );

-- catalog_items + retailer_links: SELECT publico; INSERT/UPDATE so admin
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY catalog_select_all ON public.catalog_items FOR SELECT USING (TRUE);
CREATE POLICY catalog_modify_admin ON public.catalog_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
);

CREATE POLICY retailer_links_select_all ON public.retailer_links FOR SELECT USING (TRUE);
CREATE POLICY retailer_links_modify_admin ON public.retailer_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
);

-- students: somente o proprio pai/mae acessa; admin so com auditoria
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY students_parent_only ON public.students
  FOR ALL USING (parent_id = auth.uid());

CREATE POLICY students_admin_audit ON public.students
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- carts: somente o proprio pai
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY carts_parent_only ON public.carts
  FOR ALL USING (parent_id = auth.uid());

CREATE POLICY carts_admin_select ON public.carts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- deep_link_clicks: insert qualquer logado; select admin
ALTER TABLE public.deep_link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY clicks_insert_authenticated ON public.deep_link_clicks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY clicks_admin_select ON public.deep_link_clicks
  FOR SELECT USING (
    parent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- communications: school_admin escreve, admin ve tudo
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY comms_school_admin ON public.communications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.school_admins sa WHERE sa.school_id = communications.school_id AND sa.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- whatsapp_captures: somente platform_admin
ALTER TABLE public.whatsapp_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY wa_admin_only ON public.whatsapp_captures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- students_access_log: somente admin pode ler; insercao via trigger automatica
ALTER TABLE public.students_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY students_log_admin_only ON public.students_access_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
  );

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Gera short_code de 5 caracteres alfanumericos para carts
CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..5 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Gera slug a partir do nome da escola (lowercase, sem acentos, com hifen)
CREATE OR REPLACE FUNCTION public.slugify(text_to_slugify TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(
    lower(unaccent(text_to_slugify)),
    '[^a-z0-9]+', '-', 'g'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-gerar slug ao inserir school se nao informado
CREATE OR REPLACE FUNCTION public.schools_auto_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.slugify(NEW.trade_name) || '-' || substr(NEW.id::TEXT, 1, 4);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- (necessario instalar extension unaccent no Supabase)
-- CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TRIGGER trg_schools_slug BEFORE INSERT ON public.schools FOR EACH ROW EXECUTE FUNCTION public.schools_auto_slug();

-- ============================================================
-- INEP SEED — base completa de escolas do Brasil
-- O CSV original tem 181k linhas, 21 colunas com nomes acentuados.
-- Aqui usamos snake_case ASCII e mantemos apenas as colunas relevantes para o produto.
-- Importacao via Lovable Cloud > Database > Table Editor > Import CSV.
-- Mapeie as colunas do CSV manualmente no wizard do Supabase.
-- ============================================================

CREATE TABLE public.inep_schools (
    inep_code           TEXT PRIMARY KEY,           -- coluna CSV: codigo_inep
    trade_name          TEXT NOT NULL,              -- coluna CSV: escola
    uf                  TEXT NOT NULL,              -- coluna CSV: uf
    city                TEXT NOT NULL,              -- coluna CSV: municipio
    location            TEXT,                       -- coluna CSV: localizacao (Urbana/Rural)
    admin_category      TEXT,                       -- coluna CSV: categoria_administrativa (Publica/Privada)
    admin_dependency    TEXT,                       -- coluna CSV: dependencia_administrativa (Estadual/Municipal/Federal/Privada)
    address             TEXT,                       -- coluna CSV: endereco (texto livre)
    phone               TEXT,                       -- coluna CSV: telefone
    school_size         TEXT,                       -- coluna CSV: porte_da_escola
    education_levels    TEXT,                       -- coluna CSV: etapas_e_modalidade_de_ensino_oferecidas
    latitude            NUMERIC(9,6),               -- coluna CSV: latitude
    longitude           NUMERIC(9,6),               -- coluna CSV: longitude
    cep                 TEXT,                       -- coluna CSV: cep
    cep_source          TEXT,                       -- coluna CSV: fonte_cep
    restrictions        TEXT,                       -- coluna CSV: restricao_de_atendimento
    imported_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inep_uf_city ON public.inep_schools(uf, city);
CREATE INDEX idx_inep_search ON public.inep_schools
    USING gin(to_tsvector('portuguese', trade_name || ' ' || COALESCE(city, '') || ' ' || COALESCE(uf, '')));

ALTER TABLE public.inep_schools ENABLE ROW LEVEL SECURITY;

-- Leitura publica: qualquer usuario logado consulta para autocomplete no cadastro de escola
CREATE POLICY inep_select_authenticated ON public.inep_schools
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Apenas platform_admin escreve (futuras atualizacoes do dataset)
CREATE POLICY inep_modify_admin ON public.inep_schools
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'platform_admin')
    );

-- RPC para busca tipo-ahead com bias geografico
-- (filtra UF default = 'MT' no MVP; quando expandir, removemos o filtro)
CREATE OR REPLACE FUNCTION public.search_inep_schools(
    q TEXT,
    uf_filter TEXT DEFAULT 'MT',
    limit_n INT DEFAULT 10
)
RETURNS TABLE (
    inep_code TEXT,
    trade_name TEXT,
    city TEXT,
    uf TEXT,
    address TEXT,
    cep TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    rank REAL
)
LANGUAGE SQL STABLE AS $$
    SELECT
        s.inep_code,
        s.trade_name,
        s.city,
        s.uf,
        s.address,
        s.cep,
        s.latitude,
        s.longitude,
        ts_rank(to_tsvector('portuguese', s.trade_name || ' ' || COALESCE(s.city, '')),
                plainto_tsquery('portuguese', q)) AS rank
    FROM public.inep_schools s
    WHERE
        (uf_filter IS NULL OR s.uf = uf_filter)
        AND to_tsvector('portuguese', s.trade_name || ' ' || COALESCE(s.city, ''))
            @@ plainto_tsquery('portuguese', q)
    ORDER BY rank DESC, s.trade_name ASC
    LIMIT limit_n;
$$;

-- ============================================================
-- COMENTARIOS PARA OBSERVABILIDADE LGPD
-- ============================================================

COMMENT ON TABLE public.students IS 'DADOS DE MENOR (LGPD Art. 14). Acesso restrito ao pai/mae cadastrante. Auditoria em students_access_log.';
COMMENT ON TABLE public.profiles IS 'Perfil do usuario adulto (responsavel ou administrador escolar/plataforma).';
COMMENT ON TABLE public.lists IS 'Lista oficial publicada por uma escola. Status published exigir RLS de visibilidade publica.';
COMMENT ON COLUMN public.students.first_name IS 'Apenas primeiro nome. Nao coletamos sobrenome no MVP.';
COMMENT ON COLUMN public.students.parental_consent_at IS 'Data do consentimento parental especifico para tratamento de dado de menor.';

-- ============================================================
-- FIM
-- ============================================================
