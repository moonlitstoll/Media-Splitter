import ffprobe from 'ffprobe-static';
import { execSync } from 'child_process';

const file = 'C:\\Users\\moong\\Downloads\\1_1 Tiếng Ăn 1 Lần tại Circle K Liên Tục Trong 24H_1.mp4';
const command = `"${ffprobe.path}" -v error -show_streams -print_format json "${file}"`;

try {
    const result = execSync(command).toString();
    console.log(result);
} catch (err) {
    console.error('Error executing ffprobe:', err.message);
    if (err.stderr) console.error('stderr:', err.stderr.toString());
}
