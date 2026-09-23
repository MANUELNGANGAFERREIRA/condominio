/* Dados demonstrativos para apresentação: simulam tráfego inicial da plataforma. */
(function seedPresentationData(){
  const names = ['Carlos Manuel','Ana Paula','João Pedro','Maria José','Paulo António','Sandra Miguel','Bruno Costa','Helena Silva'];
  Object.keys(DB).forEach((key)=>{
    const rows = DB[key];
    if (!Array.isArray(rows) || !rows.length) return;
    const target = Math.max(5, rows.length);
    const base = rows.slice();
    for(let i=rows.length;i<target;i++){
      const source = base[i % base.length];
      const copy = {...source, id: Math.max(0,...rows.map(r=>Number(r.id)||0))+1};
      Object.keys(copy).forEach((field)=>{
        if(field==='id') return;
        if(typeof copy[field]==='string'){
          if(/nome/i.test(field)) copy[field] = names[i % names.length] + (key==='condominios'?' — Condomínio '+(i+1):'');
          else if(/email/i.test(field)) copy[field] = 'demo.'+(i+1)+'@exemplo.co.ao';
          else if(/telefone/i.test(field)) copy[field] = '923 000 '+String(100+i).padStart(3,'0');
          else if(/numero/i.test(field)) copy[field] = 'A-'+(101+i);
        }
      });
      rows.push(copy);
    }
  });
  // Módulos de visualização que não têm CRUD próprio recebem registos de demonstração.
  const demo = {
    comunicadosView:[{id:1,titulo:'Manutenção da rede de água',descricao:'Intervenção programada no sábado.',data:'20/09/2026',estado:'Publicado'},{id:2,titulo:'Reunião de condomínio',descricao:'Assembleia mensal dos moradores.',data:'25/09/2026',estado:'Publicado'}],
    regrasView:[{id:1,titulo:'Acesso à garagem',descricao:'Respeitar os lugares atribuídos.'},{id:2,titulo:'Horário de silêncio',descricao:'Das 22h às 07h.'}],
    areasComunsView:[{id:1,nome:'Piscina',descricao:'Área de lazer',estado:'Disponível'},{id:2,nome:'Salão de festas',descricao:'Espaço para eventos',estado:'Disponível'}],
    portasView:[{id:1,nome:'Portão principal',localizacao:'Entrada principal',estado:'Aberta'},{id:2,nome:'Garagem',localizacao:'Piso -1',estado:'Fechada'}]
  };
  Object.keys(demo).forEach(k=>{ if(DB[k] && !DB[k].length) DB[k].push(...demo[k]); });
})();
