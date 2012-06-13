var encode = module.exports =
{
    encode: function (value, special, allowed)
    {
        special = special || '%';
        allowed = allowed || '';
        text = unescape(encodeURIComponent(value));
        buf = []
        for (var i = 0; i < text.length; i++)
        {
            var c = text.charAt(i);
            if ((('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z') || ('0' <= c && c <= '9') || (allowed.indexOf(c) >= 0)) && c != special)
            {
                buf.push(c);
            }
            else
            {
                buf.push(special);
                buf.push((0x100 + c.charCodeAt(0)).toString(16).substring(1, 3).toUpperCase());
            }
        }
        return buf.join('');
    },

    encode_segment: function (value)
    {
        return encode.encode(value, '_', '-.');
    },

    ab64decode: function (data)
    {
        var result = (new Buffer(data.replace(/\./g, '+'), 'base64').toString('binary'));
        return result;
    },

    ab64encode: function (data)
    {
        var result = (
            new Buffer(data, 'binary')
            .toString('base64')
            .replace(/\+/g, '.')
            .replace(/=/g, '')
        );
        return result;
    }
};

