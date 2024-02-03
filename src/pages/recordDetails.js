import * as cheerio from "cheerio";
import exp from "constants";
import fs from "fs";

function recordPage(record)
{
    const recordOverview = `
        <div class="p_10 t_l f_0 v_b">
            <div class="playlog_top_container p_r">
                <img src="https://maimaidx-eng.com/maimai-mobile/img/diff_${record.level}.png" class="playlog_diff v_b">
                ${record.level === "utage" || true ? `
                    <div class="playlog_music_kind_icon_utage f_l p_a d_f">
                        ${record?.utageKind?.reduce((prev, utageKind) => {
                            return prev + `
                                <div class="p_r t_c">
                                    <img src="https://maimaidx-eng.com/maimai-mobile/img/music_${utageKind.icon}.png" class="h_25">
                                    <div class="white playlog_music_kind_icon_utage_text t_c f_12">${utageKind.text}</div>
                                </div>
                            `;
                        }, "")}
                    </div>
                ` : ""}
                <div class="sub_title t_c f_r f_11">
                    <span class="red f_b v_b">TRACK ${record.trackNum.toString().padStart(2, "0")}</span>　<span class="v_b">${record.datetime}</span>
                </div>
                <div class="clearfix"></div>
            </div>
            <div class="playlog_${record.level}_container">
                <div class="basic_block m_5 p_5 p_l_10 f_13 break">${record.clear ? `<img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/clear.png" class="w_80 f_r">` : ""}${record.songname}</div>
                <div class="p_r f_0">
                    <img loading="lazy" src="${record.coverSrc}" class="music_img m_5 m_r_0 f_l">
                    ${record.level !== "utage" ? `<img src="https://maimaidx-eng.com/maimai-mobile/img/music_${record.kind}.png" class="playlog_music_kind_icon">` : ""}
                    <div class="playlog_result_block m_t_5 f_l">
                        <div class="playlog_achievement_label_block">
                            <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/achievement.png">
                        </div>
                        ${record.newrecord ? `<img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/newrecord.png" class="playlog_achievement_newrecord">` : ""}
                        <div class="playlog_achievement_txt t_r">${record.achievement.split(".")[0]}<span class="f_20">.${record.achievement.split(".")[1]}</span></div>
                        <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/${record.scorerank}.png?ver=1.35" class="playlog_scorerank">
                        <img src="https://maimaidx-eng.com/maimai-mobile/img/line_02.png" class="playlog_scoreline f_r">
                        <div class="playlog_result_innerblock basic_block p_5 f_13">
                            <div class="playlog_score_block f_0">
                                <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/deluxscore.png" class="w_80">
                                ${record.deluxscoreNewrecord ? `<img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/newrecord.png" class="playlog_deluxscore_newrecord">` : ""}
                                <div class="white p_r_5 f_15 f_r">${record.deluxscore.toLocaleString("en-us")} / ${record.deluxscoreTotal.toLocaleString("en-us")}</div>
                            </div>
                            <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/${record.slot1}.png?ver=1.35" class="h_35 m_5 f_l">
                            <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/${record.slot2}.png?ver=1.35" class="h_35 m_5 f_l">
                            ${record.matchingRank ? `<img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/${record.matchingRank}.png" class="playlog_matching_icon f_r">` : ""}
                            <div class="clearfix"></div>
                        </div>
                        <div class="clearfix"></div>
                    </div>
                </div>
                <div class="clearfix"></div>
            </div>
        </div>
    `;

    const grayBlock = `
        <div class="gray_block m_10 m_t_0 p_b_5 f_0">
            <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/character.png" class="m_t_5 f_l">
            <div class="clearfix"></div>
            ${
                record.charas.map((chara) => {
                    return `
                        <div class="playlog_chara_container">
                            <div class="playlog_chara_block">
                                <div class="chara_cycle_trim">
                                    <img loading="lazy" src="https://maimaidx-eng.com/maimai-mobile/img/Chara/${chara.id}.png"
                                        class="chara_cycle_img">
                                </div>
                            </div>
                            <div class="playlog_chara_star_block f_12"><img src="https://maimaidx-eng.com/maimai-mobile/img/icon_star.png" class="v_b">×${chara.star}</div>
                            <div class="playlog_chara_lv_block f_13">Lv${chara.level}</div>
                        </div>
                    `;
                })
            }
            
            <img src="https://maimaidx-eng.com/maimai-mobile/img/line_01.png" class="w_450 m_b_5">
            <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/detail.png" class="f_l">
            <div class="playlog_fl_block m_b_5 f_r f_12">
                <div class="w_96 f_l t_r"><img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/fast.png"
                        class="h_10 m_3 m_l_10 f_l">
                    <div class="p_t_5">${record.fast}</div>
                </div>
                <div class="w_96 f_l t_r"><img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/late.png"
                        class="h_10 m_3 m_l_10 f_l">
                    <div class="p_t_5">${record.late}</div>
                </div>
            </div>
            <div class="clearfix"></div>
            <div class="p_5">
                <table class="playlog_notes_detail t_r f_l f_11 f_b">
                    <tbody>
                        <tr>
                            <th></th>
                            <td class="t_c f_0"><img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/criticalperfect.png"></td>
                            <td class="t_c f_0"><img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/perfect.png"></td>
                            <td class="t_c f_0"><img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/great.png"></td>
                            <td class="t_c f_0"><img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/good.png"></td>
                            <td class="t_c f_0"><img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/miss.png"></td>
                        </tr>
                        <tr>
                            <th class="f_0"><img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/tap.png"></th>
                            ${
                                record.detailsTable.tap.map((e) => `<td>${e ?? ""}</td>`)
                            }
                        </tr>
                        <tr>
                            <th class="f_0"><img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/hold.png"></th>
                            ${
                                record.detailsTable.hold.map((e) => `<td>${e ?? ""}</td>`)
                            }
                        </tr>
                        <tr>
                            <th class="f_0"><img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/slide.png"></th>
                            ${
                                record.detailsTable.slide.map((e) => `<td>${e ?? ""}</td>`)
                            }
                        </tr>
                        <tr>
                            <th class="f_0"><img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/touch.png"></th>
                            ${
                                record.detailsTable.touch.map((e) => `<td>${e ?? ""}</td>`)
                            }
                        </tr>
                        <tr>
                            <th class="f_0"><img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/break.png"></th>
                            ${
                                record.detailsTable.break.map((e) => `<td>${e ?? ""}</td>`)
                            }
                        </tr>
                    </tbody>
                </table>
                <div class="playlog_rating_detail_block f_r t_l">
                    <div class="p_r p_3 p_l_0 f_l">
                        <img src="https://maimaidx-eng.com/maimai-mobile/img/rating_base_${record.ratingFrame}.png?ver=1.35"
                            class="h_30 f_r">
                        <div class="rating_block">${record.rating}</div>
                    </div>
                    <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/rating_${record.ratingChange > 0 ? "up" : "keep"}.png"
                        class="h_20 m_t_10 f_r">
                    <div class="t_r f_0">
                        <span class="f_l f_11 v_t">(+${record.ratingChange})</span>
                    </div>
                </div>
                <div class="clearfix m_b_5"></div>
                <div class="col2 f_l t_l f_0">
                    <div class="playlog_score_block p_5">
                        <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/maxcombo.png" class="h_20">
                        <div class="f_r f_14 white">${record.maxcombo}/${record.maxcomboTotal}</div>
                    </div>
                </div>
                <div class="col2 p_l_5 f_l t_l f_0">
                    <div class="playlog_score_block p_5">
                        <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/maxsync.png" class="h_20">
                        <div class=" f_r f_14 white">${record.maxsync ? `${record.maxsync}/` : ""}${record.maxsyncTotal ?? "-"}</div>
                    </div>
                </div>
                <div class="clearfix"></div>
            </div>
        </div>
    `;

    const match = `
        <div class="see_through_block m_10 p_5 t_l f_0" id="matching">
            ${
                record.matchs.map((e) => {
                    return `
                        <span class="playlog_${e.matchLevel}_container w_120 p_3 d_ib f_0">
                            <img src="https://maimaidx-eng.com/maimai-mobile/img/diff_${e.matchLevel}.png" class="h_16">
                            <img src="https://maimaidx-eng.com/maimai-mobile/img/icon_each.png" class="h_14 f_r">
                            <div class="basic_block p_3 t_c f_11">${e.matchName}</div>
                        </span>
                    `;
                })
            }
            ${
                (() => {
                    let tmp = "";
                    for(let i = 0; i < 3 - record.matchs.length; i++)
                    {
                        tmp += `
                            <span class="gray_block w_120 p_3 d_ib f_0 ">
                                <img src="https://maimaidx-eng.com/maimai-mobile/img/icon_each.png" class="h_16 f_r">
                                <div class="clearfix"></div>
                                <div class="basic_block p_3 t_c f_11">―</div>
                            </span>
                        `;
                    }
                    return tmp;
                })()
            }
            <div class="f_r p_t_10 d_ib f_0" id="matchingCtrl">
                <img src="https://maimaidx-eng.com/maimai-mobile/img/btn_off.png" class="h_30 m_t_5 m_b_5">
            </div>
            <div class="clearfix"></div>
        </div>
    `;

    let html = fs.readFileSync("src/pages/record.html", "utf-8");
    html = html.replace("<overview />", recordOverview);
    html = html.replace("<grayblock />", grayBlock);
    html = html.replace("<matching />", record.matchs.length > 0 ? match : "");
    return html;
}

export default recordPage;