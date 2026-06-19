// Phase 6 migration runner — uses service role key + supabase-js REST API
// Run: node scripts/migrate-phase6.mjs
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const SUPABASE_URL = 'https://cxklsqbtmhxapebaqrlh.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4a2xzcWJ0bWh4YXBlYmFxcmxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY1Mjk0OSwiZXhwIjoyMDk3MjI4OTQ5fQ.XuRuNKq8OIe0wLPxq2n29XzyoFYaFpMisZ7M0hEUerc'

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
})

// ── All 104 matches ───────────────────────────────────────────────────────────
const GROUP_STAGE = [
  // GROUP A
  { round:'Group A', match_date:'2026-06-11', team1:'Mexico',       team2:'South Africa', venue:'Estadio Azteca, Mexico City',              group_name:'A', starts_at:'2026-06-11T22:00:00+00:00', score1:2, score2:0, status:'finished' },
  { round:'Group A', match_date:'2026-06-11', team1:'South Korea',  team2:'Czechia',      venue:'Arrowhead Stadium, Kansas City',           group_name:'A', starts_at:'2026-06-11T18:00:00+00:00', score1:2, score2:1, status:'finished' },
  { round:'Group A', match_date:'2026-06-18', team1:'Czechia',      team2:'South Africa', venue:'Mercedes-Benz Stadium, Atlanta',           group_name:'A', starts_at:'2026-06-18T16:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group A', match_date:'2026-06-18', team1:'Mexico',       team2:'South Korea',  venue:'Estadio Akron, Guadalajara',               group_name:'A', starts_at:'2026-06-19T01:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group A', match_date:'2026-06-24', team1:'Czechia',      team2:'Mexico',       venue:'Estadio Azteca, Mexico City',              group_name:'A', starts_at:'2026-06-25T01:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group A', match_date:'2026-06-24', team1:'South Africa', team2:'South Korea',  venue:'Estadio BBVA, Monterrey',                  group_name:'A', starts_at:'2026-06-25T01:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  // GROUP B
  { round:'Group B', match_date:'2026-06-12', team1:'Canada',      team2:'Bosnia',       venue:'BC Place, Vancouver',                      group_name:'B', starts_at:'2026-06-12T22:00:00+00:00', score1:1, score2:1, status:'finished' },
  { round:'Group B', match_date:'2026-06-13', team1:'Qatar',       team2:'Switzerland',  venue:"Levi's Stadium, San Francisco Bay Area",   group_name:'B', starts_at:'2026-06-13T16:00:00+00:00', score1:1, score2:1, status:'finished' },
  { round:'Group B', match_date:'2026-06-18', team1:'Switzerland', team2:'Bosnia',       venue:'SoFi Stadium, Los Angeles',                group_name:'B', starts_at:'2026-06-18T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group B', match_date:'2026-06-18', team1:'Canada',      team2:'Qatar',        venue:'BC Place, Vancouver',                      group_name:'B', starts_at:'2026-06-18T22:00:00+00:00', score1:6, score2:0, status:'finished' },
  { round:'Group B', match_date:'2026-06-24', team1:'Switzerland', team2:'Canada',       venue:'BC Place, Vancouver',                      group_name:'B', starts_at:'2026-06-24T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group B', match_date:'2026-06-24', team1:'Bosnia',      team2:'Qatar',        venue:'Lumen Field, Seattle',                     group_name:'B', starts_at:'2026-06-24T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  // GROUP C
  { round:'Group C', match_date:'2026-06-13', team1:'Brazil',   team2:'Morocco',  venue:'AT&T Stadium, Dallas',                           group_name:'C', starts_at:'2026-06-13T22:00:00+00:00', score1:1, score2:1, status:'finished' },
  { round:'Group C', match_date:'2026-06-13', team1:'Haiti',    team2:'Scotland', venue:'Gillette Stadium, Boston',                        group_name:'C', starts_at:'2026-06-13T18:00:00+00:00', score1:0, score2:1, status:'finished' },
  { round:'Group C', match_date:'2026-06-19', team1:'Scotland', team2:'Morocco',  venue:'Gillette Stadium, Boston',                        group_name:'C', starts_at:'2026-06-19T22:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group C', match_date:'2026-06-19', team1:'Brazil',   team2:'Haiti',    venue:'Lincoln Financial Field, Philadelphia',           group_name:'C', starts_at:'2026-06-20T01:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group C', match_date:'2026-06-24', team1:'Scotland', team2:'Brazil',   venue:'Hard Rock Stadium, Miami',                        group_name:'C', starts_at:'2026-06-24T22:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group C', match_date:'2026-06-24', team1:'Morocco',  team2:'Haiti',    venue:'Mercedes-Benz Stadium, Atlanta',                  group_name:'C', starts_at:'2026-06-24T22:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  // GROUP D
  { round:'Group D', match_date:'2026-06-12', team1:'USA',       team2:'Paraguay',  venue:'SoFi Stadium, Los Angeles',                    group_name:'D', starts_at:'2026-06-12T18:00:00+00:00', score1:4, score2:1, status:'finished' },
  { round:'Group D', match_date:'2026-06-13', team1:'Australia', team2:'Turkiye',   venue:'NRG Stadium, Houston',                          group_name:'D', starts_at:'2026-06-13T19:00:00+00:00', score1:2, score2:0, status:'finished' },
  { round:'Group D', match_date:'2026-06-19', team1:'USA',       team2:'Australia', venue:'Lumen Field, Seattle',                          group_name:'D', starts_at:'2026-06-19T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group D', match_date:'2026-06-19', team1:'Turkiye',   team2:'Paraguay',  venue:"Levi's Stadium, San Francisco Bay Area",        group_name:'D', starts_at:'2026-06-20T04:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group D', match_date:'2026-06-25', team1:'Turkiye',   team2:'USA',       venue:'SoFi Stadium, Los Angeles',                    group_name:'D', starts_at:'2026-06-26T02:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group D', match_date:'2026-06-25', team1:'Paraguay',  team2:'Australia', venue:"Levi's Stadium, San Francisco Bay Area",        group_name:'D', starts_at:'2026-06-26T02:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  // GROUP E
  { round:'Group E', match_date:'2026-06-14', team1:'Germany',     team2:'Curacao',     venue:'MetLife Stadium, New York/New Jersey',      group_name:'E', starts_at:'2026-06-14T16:00:00+00:00', score1:7, score2:1, status:'finished' },
  { round:'Group E', match_date:'2026-06-14', team1:'Ivory Coast', team2:'Ecuador',     venue:'Hard Rock Stadium, Miami',                  group_name:'E', starts_at:'2026-06-14T22:00:00+00:00', score1:1, score2:0, status:'finished' },
  { round:'Group E', match_date:'2026-06-20', team1:'Germany',     team2:'Ivory Coast', venue:'BMO Field, Toronto',                        group_name:'E', starts_at:'2026-06-20T20:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group E', match_date:'2026-06-20', team1:'Ecuador',     team2:'Curacao',     venue:'Arrowhead Stadium, Kansas City',            group_name:'E', starts_at:'2026-06-21T00:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group E', match_date:'2026-06-25', team1:'Ecuador',     team2:'Germany',     venue:'MetLife Stadium, New York/New Jersey',      group_name:'E', starts_at:'2026-06-25T20:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group E', match_date:'2026-06-25', team1:'Curacao',     team2:'Ivory Coast', venue:'Lincoln Financial Field, Philadelphia',     group_name:'E', starts_at:'2026-06-25T20:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  // GROUP F
  { round:'Group F', match_date:'2026-06-14', team1:'Netherlands', team2:'Japan',   venue:'Rose Bowl, Los Angeles',                        group_name:'F', starts_at:'2026-06-14T19:00:00+00:00', score1:2, score2:2, status:'finished' },
  { round:'Group F', match_date:'2026-06-14', team1:'Sweden',      team2:'Tunisia', venue:'Mercedes-Benz Stadium, Atlanta',                group_name:'F', starts_at:'2026-06-14T23:00:00+00:00', score1:5, score2:1, status:'finished' },
  { round:'Group F', match_date:'2026-06-20', team1:'Netherlands', team2:'Sweden',  venue:'NRG Stadium, Houston',                          group_name:'F', starts_at:'2026-06-20T17:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group F', match_date:'2026-06-20', team1:'Tunisia',     team2:'Japan',   venue:'Estadio BBVA, Monterrey',                       group_name:'F', starts_at:'2026-06-21T04:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group F', match_date:'2026-06-25', team1:'Japan',       team2:'Sweden',  venue:'AT&T Stadium, Dallas',                          group_name:'F', starts_at:'2026-06-25T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group F', match_date:'2026-06-25', team1:'Tunisia',     team2:'Netherlands', venue:'Arrowhead Stadium, Kansas City',            group_name:'F', starts_at:'2026-06-25T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  // GROUP G
  { round:'Group G', match_date:'2026-06-15', team1:'Iran',        team2:'New Zealand', venue:'Lincoln Financial Field, Philadelphia',     group_name:'G', starts_at:'2026-06-15T16:00:00+00:00', score1:2, score2:2, status:'finished' },
  { round:'Group G', match_date:'2026-06-15', team1:'Belgium',     team2:'Egypt',       venue:'BMO Field, Toronto',                        group_name:'G', starts_at:'2026-06-15T22:00:00+00:00', score1:1, score2:1, status:'finished' },
  { round:'Group G', match_date:'2026-06-21', team1:'Belgium',     team2:'Iran',        venue:'SoFi Stadium, Los Angeles',                 group_name:'G', starts_at:'2026-06-21T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group G', match_date:'2026-06-21', team1:'New Zealand', team2:'Egypt',       venue:'BC Place, Vancouver',                       group_name:'G', starts_at:'2026-06-22T01:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group G', match_date:'2026-06-26', team1:'Egypt',       team2:'Iran',        venue:'Lumen Field, Seattle',                      group_name:'G', starts_at:'2026-06-27T03:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group G', match_date:'2026-06-26', team1:'New Zealand', team2:'Belgium',     venue:'BC Place, Vancouver',                       group_name:'G', starts_at:'2026-06-27T03:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  // GROUP H
  { round:'Group H', match_date:'2026-06-15', team1:'Spain',        team2:'Cape Verde',   venue:'Estadio BBVA, Monterrey',                 group_name:'H', starts_at:'2026-06-15T19:00:00+00:00', score1:0, score2:0, status:'finished' },
  { round:'Group H', match_date:'2026-06-15', team1:'Saudi Arabia', team2:'Uruguay',      venue:'Estadio Akron, Guadalajara',               group_name:'H', starts_at:'2026-06-16T01:00:00+00:00', score1:1, score2:1, status:'finished' },
  { round:'Group H', match_date:'2026-06-21', team1:'Spain',        team2:'Saudi Arabia', venue:'Mercedes-Benz Stadium, Atlanta',           group_name:'H', starts_at:'2026-06-21T16:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group H', match_date:'2026-06-21', team1:'Uruguay',      team2:'Cape Verde',   venue:'Hard Rock Stadium, Miami',                 group_name:'H', starts_at:'2026-06-21T22:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group H', match_date:'2026-06-26', team1:'Cape Verde',   team2:'Saudi Arabia', venue:'NRG Stadium, Houston',                     group_name:'H', starts_at:'2026-06-27T00:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group H', match_date:'2026-06-26', team1:'Uruguay',      team2:'Spain',        venue:'Estadio Akron, Guadalajara',               group_name:'H', starts_at:'2026-06-27T00:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  // GROUP I
  { round:'Group I', match_date:'2026-06-16', team1:'France',  team2:'Senegal', venue:'MetLife Stadium, New York/New Jersey',              group_name:'I', starts_at:'2026-06-16T22:00:00+00:00', score1:3, score2:1, status:'finished' },
  { round:'Group I', match_date:'2026-06-16', team1:'Iraq',    team2:'Norway',  venue:'BMO Field, Toronto',                                group_name:'I', starts_at:'2026-06-16T18:00:00+00:00', score1:1, score2:4, status:'finished' },
  { round:'Group I', match_date:'2026-06-22', team1:'France',  team2:'Iraq',    venue:'Lincoln Financial Field, Philadelphia',             group_name:'I', starts_at:'2026-06-22T21:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group I', match_date:'2026-06-22', team1:'Norway',  team2:'Senegal', venue:'MetLife Stadium, New York/New Jersey',              group_name:'I', starts_at:'2026-06-23T00:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group I', match_date:'2026-06-26', team1:'Norway',  team2:'France',  venue:'Gillette Stadium, Boston',                          group_name:'I', starts_at:'2026-06-26T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group I', match_date:'2026-06-26', team1:'Senegal', team2:'Iraq',    venue:'BMO Field, Toronto',                                group_name:'I', starts_at:'2026-06-26T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  // GROUP J
  { round:'Group J', match_date:'2026-06-16', team1:'Argentina', team2:'Algeria', venue:'AT&T Stadium, Dallas',                            group_name:'J', starts_at:'2026-06-16T16:00:00+00:00', score1:3, score2:0, status:'finished' },
  { round:'Group J', match_date:'2026-06-16', team1:'Austria',   team2:'Jordan',  venue:'Rose Bowl, Los Angeles',                          group_name:'J', starts_at:'2026-06-17T01:00:00+00:00', score1:3, score2:1, status:'finished' },
  { round:'Group J', match_date:'2026-06-22', team1:'Argentina', team2:'Austria', venue:'AT&T Stadium, Dallas',                            group_name:'J', starts_at:'2026-06-22T17:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group J', match_date:'2026-06-22', team1:'Jordan',    team2:'Algeria', venue:"Levi's Stadium, San Francisco Bay Area",          group_name:'J', starts_at:'2026-06-23T03:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group J', match_date:'2026-06-27', team1:'Algeria',   team2:'Austria', venue:'Arrowhead Stadium, Kansas City',                  group_name:'J', starts_at:'2026-06-28T02:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group J', match_date:'2026-06-27', team1:'Jordan',    team2:'Argentina', venue:'AT&T Stadium, Dallas',                          group_name:'J', starts_at:'2026-06-28T02:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  // GROUP K
  { round:'Group K', match_date:'2026-06-17', team1:'Portugal',   team2:'DR Congo',   venue:'Lumen Field, Seattle',                        group_name:'K', starts_at:'2026-06-17T16:00:00+00:00', score1:1, score2:1, status:'finished' },
  { round:'Group K', match_date:'2026-06-17', team1:'Uzbekistan', team2:'Colombia',   venue:'Hard Rock Stadium, Miami',                    group_name:'K', starts_at:'2026-06-17T22:00:00+00:00', score1:1, score2:3, status:'finished' },
  { round:'Group K', match_date:'2026-06-23', team1:'Portugal',   team2:'Uzbekistan', venue:'NRG Stadium, Houston',                        group_name:'K', starts_at:'2026-06-23T17:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group K', match_date:'2026-06-23', team1:'Colombia',   team2:'DR Congo',   venue:'Estadio Akron, Guadalajara',                  group_name:'K', starts_at:'2026-06-24T02:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group K', match_date:'2026-06-27', team1:'Colombia',   team2:'Portugal',   venue:'Hard Rock Stadium, Miami',                    group_name:'K', starts_at:'2026-06-27T23:30:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group K', match_date:'2026-06-27', team1:'DR Congo',   team2:'Uzbekistan', venue:'Mercedes-Benz Stadium, Atlanta',              group_name:'K', starts_at:'2026-06-27T23:30:00+00:00', score1:null, score2:null, status:'upcoming' },
  // GROUP L
  { round:'Group L', match_date:'2026-06-17', team1:'England', team2:'Croatia', venue:'MetLife Stadium, New York/New Jersey',              group_name:'L', starts_at:'2026-06-17T19:00:00+00:00', score1:4, score2:2, status:'finished' },
  { round:'Group L', match_date:'2026-06-17', team1:'Ghana',   team2:'Panama',  venue:'Mercedes-Benz Stadium, Atlanta',                    group_name:'L', starts_at:'2026-06-17T23:00:00+00:00', score1:1, score2:0, status:'finished' },
  { round:'Group L', match_date:'2026-06-23', team1:'England', team2:'Ghana',   venue:'Gillette Stadium, Boston',                          group_name:'L', starts_at:'2026-06-23T20:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group L', match_date:'2026-06-23', team1:'Panama',  team2:'Croatia', venue:'BMO Field, Toronto',                                group_name:'L', starts_at:'2026-06-23T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group L', match_date:'2026-06-27', team1:'Panama',  team2:'England', venue:'MetLife Stadium, New York/New Jersey',              group_name:'L', starts_at:'2026-06-27T21:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Group L', match_date:'2026-06-27', team1:'Croatia', team2:'Ghana',   venue:'Lincoln Financial Field, Philadelphia',             group_name:'L', starts_at:'2026-06-27T21:00:00+00:00', score1:null, score2:null, status:'upcoming' },
]

const KNOCKOUTS = [
  // Round of 32
  { round:'Round of 32', match_date:'2026-06-29', team1:'TBD', team2:'TBD', venue:'Estadio Azteca, Mexico City',              group_name:null, starts_at:'2026-06-29T22:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-06-29', team1:'TBD', team2:'TBD', venue:'MetLife Stadium, New York/New Jersey',     group_name:null, starts_at:'2026-06-30T02:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-06-30', team1:'TBD', team2:'TBD', venue:'SoFi Stadium, Los Angeles',               group_name:null, starts_at:'2026-06-30T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-06-30', team1:'TBD', team2:'TBD', venue:'AT&T Stadium, Dallas',                    group_name:null, starts_at:'2026-06-30T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-07-01', team1:'TBD', team2:'TBD', venue:'Hard Rock Stadium, Miami',                group_name:null, starts_at:'2026-07-01T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-07-01', team1:'TBD', team2:'TBD', venue:'Lumen Field, Seattle',                   group_name:null, starts_at:'2026-07-01T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-07-02', team1:'TBD', team2:'TBD', venue:'Mercedes-Benz Stadium, Atlanta',         group_name:null, starts_at:'2026-07-02T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-07-02', team1:'TBD', team2:'TBD', venue:'BC Place, Vancouver',                    group_name:null, starts_at:'2026-07-02T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-07-03', team1:'TBD', team2:'TBD', venue:'NRG Stadium, Houston',                   group_name:null, starts_at:'2026-07-03T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-07-03', team1:'TBD', team2:'TBD', venue:'BMO Field, Toronto',                     group_name:null, starts_at:'2026-07-03T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-07-04', team1:'TBD', team2:'TBD', venue:'Rose Bowl, Los Angeles',                 group_name:null, starts_at:'2026-07-04T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-07-04', team1:'TBD', team2:'TBD', venue:'Lincoln Financial Field, Philadelphia',  group_name:null, starts_at:'2026-07-04T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-07-04', team1:'TBD', team2:'TBD', venue:'Arrowhead Stadium, Kansas City',         group_name:null, starts_at:'2026-07-05T01:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-07-05', team1:'TBD', team2:'TBD', venue:"Levi's Stadium, San Francisco Bay Area", group_name:null, starts_at:'2026-07-05T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-07-05', team1:'TBD', team2:'TBD', venue:'Estadio BBVA, Monterrey',               group_name:null, starts_at:'2026-07-05T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 32', match_date:'2026-07-06', team1:'TBD', team2:'TBD', venue:'Gillette Stadium, Boston',               group_name:null, starts_at:'2026-07-06T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  // Round of 16
  { round:'Round of 16', match_date:'2026-07-08', team1:'TBD', team2:'TBD', venue:'MetLife Stadium, New York/New Jersey',   group_name:null, starts_at:'2026-07-08T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 16', match_date:'2026-07-08', team1:'TBD', team2:'TBD', venue:'SoFi Stadium, Los Angeles',             group_name:null, starts_at:'2026-07-08T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 16', match_date:'2026-07-09', team1:'TBD', team2:'TBD', venue:'AT&T Stadium, Dallas',                  group_name:null, starts_at:'2026-07-09T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 16', match_date:'2026-07-09', team1:'TBD', team2:'TBD', venue:'Hard Rock Stadium, Miami',              group_name:null, starts_at:'2026-07-09T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 16', match_date:'2026-07-10', team1:'TBD', team2:'TBD', venue:'Lumen Field, Seattle',                  group_name:null, starts_at:'2026-07-10T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 16', match_date:'2026-07-10', team1:'TBD', team2:'TBD', venue:'NRG Stadium, Houston',                  group_name:null, starts_at:'2026-07-10T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 16', match_date:'2026-07-11', team1:'TBD', team2:'TBD', venue:'Mercedes-Benz Stadium, Atlanta',        group_name:null, starts_at:'2026-07-11T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Round of 16', match_date:'2026-07-11', team1:'TBD', team2:'TBD', venue:'Rose Bowl, Los Angeles',                group_name:null, starts_at:'2026-07-11T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  // Quarter-finals
  { round:'Quarter-final', match_date:'2026-07-14', team1:'TBD', team2:'TBD', venue:'MetLife Stadium, New York/New Jersey', group_name:null, starts_at:'2026-07-14T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Quarter-final', match_date:'2026-07-14', team1:'TBD', team2:'TBD', venue:'SoFi Stadium, Los Angeles',           group_name:null, starts_at:'2026-07-14T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Quarter-final', match_date:'2026-07-15', team1:'TBD', team2:'TBD', venue:'AT&T Stadium, Dallas',                group_name:null, starts_at:'2026-07-15T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Quarter-final', match_date:'2026-07-16', team1:'TBD', team2:'TBD', venue:'Hard Rock Stadium, Miami',            group_name:null, starts_at:'2026-07-16T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  // Semi-finals
  { round:'Semi-final', match_date:'2026-07-18', team1:'TBD', team2:'TBD', venue:'MetLife Stadium, New York/New Jersey',   group_name:null, starts_at:'2026-07-18T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Semi-final', match_date:'2026-07-19', team1:'TBD', team2:'TBD', venue:'Rose Bowl, Los Angeles',                 group_name:null, starts_at:'2026-07-19T23:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  // Third place + Final
  { round:'Third Place', match_date:'2026-07-18', team1:'TBD', team2:'TBD', venue:'AT&T Stadium, Dallas',                  group_name:null, starts_at:'2026-07-18T19:00:00+00:00', score1:null, score2:null, status:'upcoming' },
  { round:'Final',       match_date:'2026-07-19', team1:'TBD', team2:'TBD', venue:'MetLife Stadium, New York/New Jersey',  group_name:null, starts_at:'2026-07-20T00:00:00+00:00', score1:null, score2:null, status:'upcoming' },
]

async function run() {
  console.log('→ Deleting existing matches (cascades predictions/messages/odds)…')
  const { error: delErr } = await sb.from('matches').delete().gte('match_date', '2000-01-01')
  if (delErr) { console.error('DELETE failed:', delErr.message); process.exit(1) }
  console.log('  ✓ All existing matches removed')

  const all = [...GROUP_STAGE, ...KNOCKOUTS]
  console.log(`→ Inserting ${all.length} matches…`)

  // Insert in two batches to stay well under PostgREST payload limits
  const mid = Math.ceil(all.length / 2)
  const batches = [
    { rows: all.slice(0, mid), label: 'batch 1/2' },
    { rows: all.slice(mid),    label: 'batch 2/2' },
  ]
  for (const { rows, label } of batches) {
    const { error: insErr } = await sb.from('matches').insert(rows)
    if (insErr) { console.error(`INSERT ${label} failed:`, insErr.message); process.exit(1) }
    console.log(`  ✓ ${label} inserted (${rows.length} rows)`)
  }

  // Verify
  const { count } = await sb.from('matches').select('*', { count: 'exact', head: true })
  console.log(`\n✅ Done — ${count} matches in production Supabase`)
  console.log('   NOTE: run the unique index + realtime DDL via the Supabase SQL Editor:')
  console.log('   CREATE UNIQUE INDEX IF NOT EXISTS matches_team1_team2_starts_at_uidx ON public.matches (team1, team2, starts_at);')
  console.log('   ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;')
}

run().catch(e => { console.error(e); process.exit(1) })
