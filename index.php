<?php
define('ABSPATH', dirname(__FILE__));

// From here: http://www.autistici.org/ermes/index.php?pag=1&post=15
// and fixed here: http://www.barattalo.it
// ------------------------------
// example:
// print_r( tagReader ("myfile.mp3") );
// ------------------------------
function tagReader($file){
    $id3v23 = array("TIT2","TALB","TPE1","TRCK","TDRC","TLEN","USLT");
    $id3v22 = array("TT2","TAL","TP1","TRK","TYE","TLE","ULT");
    $fsize = filesize($file);
    $fd = fopen($file,"r");
    $tag = fread($fd,$fsize);
    $tmp = "";
    fclose($fd);
    if (substr($tag,0,3) == "ID3") {
        $result['FileName'] = $file;
        $result['TAG'] = substr($tag,0,3);
        $result['Version'] = hexdec(bin2hex(substr($tag,3,1))).".".hexdec(bin2hex(substr($tag,4,1)));
    }
    if($result['Version'] == "4.0" || $result['Version'] == "3.0"){
        for ($i=0;$i<count($id3v23);$i++){
            if (strpos($tag,$id3v23[$i].chr(0))!= FALSE){
                $pos = strpos($tag, $id3v23[$i].chr(0));
                $len = hexdec(bin2hex(substr($tag,($pos+5),3)));
                $data = substr($tag, $pos, 10+$len);
                for ($a=0;$a<strlen($data);$a++){
                    $char = substr($data,$a,1);
                    if($char >= " " && $char <= "~") $tmp.=$char;
                }
                if(substr($tmp,0,4) == "TIT2") $result['Title'] = substr($tmp,4);
                if(substr($tmp,0,4) == "TALB") $result['Album'] = substr($tmp,4);
                if(substr($tmp,0,4) == "TPE1") $result['Artist'] = substr($tmp,4);
                if(substr($tmp,0,4) == "TRCK") $result['Track'] = substr($tmp,4);
                if(substr($tmp,0,4) == "TDRC") $result['Year'] = substr($tmp,4);
                if(substr($tmp,0,4) == "TLEN") $result['Length'] = substr($tmp,4);
                if(substr($tmp,0,4) == "USLT") $result['Lyric'] = substr($tmp,7);
                $tmp = "";
            }
        }
    }
    if($result['Version'] == "2.0"){
        for ($i=0;$i<count($id3v22);$i++){
            if (strpos($tag,$id3v22[$i].chr(0))!= FALSE){
                $pos = strpos($tag, $id3v22[$i].chr(0));
                $len = hexdec(bin2hex(substr($tag,($pos+3),3)));
                $data = substr($tag, $pos, 6+$len);
                for ($a=0;$a<strlen($data);$a++){
                    $char = substr($data,$a,1);
                    if($char >= " " && $char <= "~") $tmp.=$char;
                }
                if(substr($tmp,0,3) == "TT2") $result['Title'] = substr($tmp,3);
                if(substr($tmp,0,3) == "TAL") $result['Album'] = substr($tmp,3);
                if(substr($tmp,0,3) == "TP1") $result['Artist'] = substr($tmp,3);
                if(substr($tmp,0,3) == "TRK") $result['Track'] = substr($tmp,3);
                if(substr($tmp,0,3) == "TYE") $result['Year'] = substr($tmp,3);
                if(substr($tmp,0,3) == "TLE") $result['Length'] = substr($tmp,3);
                if(substr($tmp,0,3) == "ULT") $result['Lyric'] = substr($tmp,6);
                $tmp = "";
            }
        }
    }
    return $result;
}


function read_music_folder($dir = '.')
	{
		$file_list = array();
		if ($handler = opendir($dir)) {
			while (($sub = readdir($handler)) !== FALSE) {
				if (is_file($dir."/".$sub)) {
					$file_list[] = $dir."/".$sub;
				}
			}
			closedir($handler);
		}
		return $file_list;
	}
$music_files = read_music_folder('audio');
?>
<!DOCTYPE HTML>
<html lang="en">
	<head>
		<title>audioSPHERE | Jason Block | Doug Mann | Brian Sherman</title>
		<meta charset="utf-8">
		<link rel="stylesheet" href="css/style.css">
	</head>
	<body>
		<section id="playlist">
			<div id="playback-control">
			<!--Something will go here-->
			</div>
			<div id="song-list">
				<?php
				// populate song list here
				if ($music_files) {
					$c = 0;
					foreach ($music_files as $song) { 
						$tag = tagReader($song);
					?>
				<a class="file" href="<?php echo $song; ?>" data-artist="<?php echo $tag['Artist']; ?>" data-album="<?php echo $tag['Album']; ?>" data-title="<?php echo $tag['Title']; ?>" data-order="<?php echo $c; ?>">	
					<div class="song">		
						<div class="song-left">
							<!--Image-->
						</div>
						<div class="song-right">
							<span class="song-info title"><?php echo $tag['Title']; ?></span>
							<span class="song-info artist"><?php echo $tag['Artist']; ?></span>
							<span class="song-info album"><?php echo $tag['Album']; ?></span>
						</div>
					</div> 
				</a>
				
				<?php 
						$c++;
					}
				}
				?>
				<!--<a class="song">
					<div class="song-left">
						// image
					</div>
					<div class="song-right">
						<span class="song-info artist"></span>
						<span class="song-info title"></span>
						<span class="song-info album"></span>
					</div>
				</a>-->
			</div>
		</section>
		<div id="toggle"></div>
		<section id="visualizer">
		
		</section>
		<script src="js/three.js"></script>

		<script>


		</script>
		<script src="js/mylibs/soundmanager2-jsmin.js"></script>
		<script src="js/libs/jquery-1.6.2.min.js"></script>
		<script type="x-shader/x-vertex" id="vertexShader">
		varying vec3 vNormal;
		void main() {
			vNormal = normalize( normalMatrix * normal );
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
		</script>
		<script type="x-shader/x-fragment" id="fragmentShader">

		uniform float time;
    	uniform vec2 resolution;

    	void main( void ) {

        vec2 position = - 1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;
        float red = abs( sin( position.x * position.y + time / 5.0 ) );
        float green = abs( cos( position.x * position.y + time / 4.0 ) );
        float blue = abs( cos( position.x * position.y + time / 3.0 ) );
        gl_FragColor = vec4( red, green, blue, 1.0 );

        }
		</script>
		<script src="js/script.js"></script>
		<script src="js/libs/helvetiker_regular.typeface.js"></script>
	</body>
</html>