import Router from "../router.js";
import * as cheerio from "cheerio";

Router.register(/\/record\/$/, (req, html) => {
    const $ = cheerio.load(html);
    $("footer").before(`
        <div class="t_c" id="viewmore_action">
            <script language="javascript">
                let viewmore_offset = 0;
                let viewmore_loading = false;
                function viewmore()
                {
                    if(viewmore_loading || viewmore_offset === null)
                    {
                        return;
                    }
                    viewmore_loading = true;
                    const xhr = new XMLHttpRequest();
                    xhr.open("GET", "/extend/recorddata/?offset=" + viewmore_offset);
                    xhr.onreadystatechange = () => {
                        if(xhr.readyState === 4 && xhr.status === 200)
                        {
                            const data = JSON.parse(xhr.responseText);
                            for(let record of data.data)
                            {
                                const datetime = new Date(record.datetime);
                                const domstring = \`
                                    <div class="p_10 t_l f_0 v_b">
                                        <div class="playlog_top_container p_r">
                                            <img src="https://maimaidx-eng.com/maimai-mobile/img/diff_$\{record.level}.png" class="playlog_diff v_b">
                                            <div class="sub_title t_c f_r f_11">
                                                <span class="red f_b v_b">TRACK $\{record.trackNum.toString().padStart(2, "0")}</span>　<span class="v_b">$\{record.datetime}</span>
                                            </div>
                                            <div class="clearfix"></div>
                                        </div>
                                        <div class="playlog_$\{record.level}_container">
                                            <div class="basic_block m_5 p_5 p_l_10 f_13 break">$\{record.clear ? \`<img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/clear.png" class="w_80 f_r">\` : ""}$\{record.songname}</div>
                                            <div class="p_r f_0">
                                                <img loading="lazy" src="$\{record.coverSrc}" class="music_img m_5 m_r_0 f_l">
                                                <img src="https://maimaidx-eng.com/maimai-mobile/img/music_$\{record.kind}.png" class="playlog_music_kind_icon">
                                                <div class="playlog_result_block m_t_5 f_l">
                                                    <div class="playlog_achievement_label_block">
                                                        <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/achievement.png">
                                                    </div>
                                                    $\{record.newrecord ? \`<img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/newrecord.png" class="playlog_achievement_newrecord">\` : ""}
                                                    <div class="playlog_achievement_txt t_r">$\{record.achievement.split(".")[0]}<span class="f_20">.$\{record.achievement.split(".")[1]}</span></div>
                                                    <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/$\{record.scorerank}.png?ver=1.35" class="playlog_scorerank">
                                                    <img src="https://maimaidx-eng.com/maimai-mobile/img/line_02.png" class="playlog_scoreline f_r">
                                                    <div class="playlog_result_innerblock basic_block p_5 f_13">
                                                        <div class="playlog_score_block f_0">
                                                            <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/deluxscore.png" class="w_80">
                                                            $\{record.deluxscoreNewrecord ? \`<img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/newrecord.png" class="playlog_deluxscore_newrecord">\` : ""}
                                                            <div class="white p_r_5 f_15 f_r">$\{record.deluxscore.toLocaleString("en-us")} / $\{record.deluxscoreTotal.toLocaleString("en-us")}</div>
                                                        </div>
                                                        <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/$\{record.slot1}.png?ver=1.35" class="h_35 m_5 f_l">
                                                        <img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/$\{record.slot2}.png?ver=1.35" class="h_35 m_5 f_l">
                                                        $\{record.matchingRank ? \`<img src="https://maimaidx-eng.com/maimai-mobile/img/playlog/$\{record.matchingRank}.png" class="playlog_matching_icon f_r">\` : ""}
                                                        <div class="clearfix"></div>
                                                    </div>
                                                    <form action="/maimai-mobile/record/playlogDetail/" method="get" accept-charset="utf-8" class="m_t_5 t_r">
                                                        <input type="hidden" name="idx" value="29,1692354402">
                                                        <button type="submit" class="f_0"><img src="https://maimaidx-eng.com/maimai-mobile/img/btn_detail.png" class="w_84"></button>
                                                    </form>
                                                    <div class="clearfix"></div>
                                                </div>
                                            </div>
                                            <div class="clearfix"></div>
                                        </div>
                                    </div>
                                \`;
                                $("#viewmore_action").before(domstring);
                            }
                            viewmore_offset = data.next;
                            if(viewmore_offset === null)
                            {
                                $("#viewmore_action").remove();
                            }
                            viewmore_loading = false;
                        }
                    };
                    xhr.onerror = () => {
                        viewmore_loading = false;
                    };
                    xhr.send();
                }
            </script>
            <img src="https://maimaidx-eng.com/maimai-mobile/img/line_02.png" class="w_450" />
            <button type="button" onclick="javascript:viewmore()" class="m_10">
                <img src="https://maimaidx-eng.com/maimai-mobile/img/btn_more.png" class="w_84" />
            </button>
        </div>
    `);
    return $.html();
});